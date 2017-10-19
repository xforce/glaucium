import moment from 'moment';

// Some internal helper stuff
function GetDateRangePrior(numberOfDays) {
    let dateArray = new Array();
    for (let i = 0; numberOfDays >= 0; ++i) {
        dateArray.push(moment().subtract(numberOfDays, 'd').toDate());
        --numberOfDays;
    }
    return dateArray;
}

function DateIsoFormat(date) {
    return date.toISOString().substring(0, 10);
}

function StringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colors = [];
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        colors.push(parseInt(value.toString(16).substr(-2), 16));
    }
    return colors;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class RecentReportResult {
    items = [];
    loadedReportCount: number = 0;
    totalReportCount: number = 0;
}

export class DayHistogramResultData {
    datasets = [];
    dates = [];
}

export class RequestPagination {
    rowsPerPage: number = 0;
    page: number = 0;
}

export class RequestFilters {
    versions: Array<string> = null;
    platforms: Array<string> = null;
    products: Array<string> = null;
    start_date = null;
    end_date = null;
}

class Api {

    private doRequest(request_data: any): Promise<Object> {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            let url = 'api/search';
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    resolve(jsonResponse);
                } else if (xhr.readyState === 4) {
                    reject();
                }
            };
            xhr.send(JSON.stringify(request_data));
        });
    }

    async getRecentReports(sortBy: string, descending: boolean): Promise<RecentReportResult> {
        let meow = {
            'columns': ['signature', 'product', 'version'],
            'results_from': 0,
            'results_size': 50,
            'sort': { 'field': 'date', 'asc': false },
            'facets': [
                'signature'
            ],
            'histograms': {
                'date': 'version'
            }
        };

        let jsonResponse = await this.doRequest(meow) as any;
        let resultArray = [];
        jsonResponse.hits.forEach((hit) => {
            const date = hit.processed_crash.crash_date && hit.processed_crash.crash_date !== undefined ? hit.processed_crash.crash_date : hit.processed_crash.date_processed;
            resultArray.push(
                {
                    crash_id: hit.crash_id,
                    date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
                    signature: hit.processed_crash.signature,
                    product: hit.processed_crash.product,
                    version: hit.processed_crash.version,
                    platform: hit.processed_crash.os_name,
                });
        });
        if (sortBy) {
            resultArray = resultArray.sort((a, b) => {
                const sortA = a[sortBy];
                const sortB = b[sortBy];
                if (descending) {
                    if (sortA < sortB) return 1;
                    if (sortA > sortB) return -1;
                    return 0;
                } else {
                    if (sortA < sortB) return -1;
                    if (sortA > sortB) return 1;
                    return 0;
                }
            });
        }
        return { items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: jsonResponse.total };
    }

    async getDayHistogramData(days): Promise<DayHistogramResultData> {
        let endDate = moment();
        let startDate = moment().subtract(days, 'd');
        let meow = {
            'columns': ['signature', 'product', 'version'],
            'filters': [
                { 'name': 'date', 'operator': 'gte', 'value': startDate.format() },
                { 'name': 'date', 'operator': 'lt', 'value': endDate.format() }
            ],
            'sort': { 'field': 'date', 'asc': false },
            'facets': [
                'signature'
            ],
            'histograms': {
                'date': 'version'
            }
        };

        // TODO(alexander): Cache the versions somewhere
        let versions = await this.getVersions();
        let jsonResponse = await this.doRequest(meow) as any;
        let dates = GetDateRangePrior(days);
        let ctx = document.getElementById('crash-stat-chart-' + days + 'days');
        let versionDataSets = [];
        let datasets = [];
        let dataStruct = {};
        // First initialize the structure with all versions and all expected
        // days, each having a crash count of zero.
        // dataStruct becomes something like this:
        // { '2.0': { '2000-01-01': 0, '2000-01-02': 0 } }
        let counter = 0;
        versions.forEach(function (version) {
            dataStruct[version] = {};

            let currentDay = +startDate;
            while (currentDay <= +endDate) {
                let day = DateIsoFormat(new Date(currentDay));
                dataStruct[version][day] = 0;
                ++counter;
                currentDay += 24 * 60 * 60 * 1000;
            }
        });
        // Nan, if the = versionCount.count below is changed to +=
        for (let histogramIndex in jsonResponse.histograms.date) {
            let histogram = jsonResponse.histograms.date[histogramIndex];
            let versionsCounts = histogram.facets.version;
            versionsCounts.forEach(function (versionCount) {
                let version = versionCount.term;
                let versionIndex = versions.indexOf(version);
                let baseVersion = null;

                if (versionIndex > -1) {
                    baseVersion = version;
                }
                else if (versionIndex === -1) {
                    console.log('Ehm rip');
                }
                dataStruct[baseVersion][histogram.term.substring(0, 10)] = dataStruct[baseVersion][histogram.term.substring(0, 10)] + versionCount.count; // Works fine
            });
            counter = 0;
        }
        for (let dataS in dataStruct) {
            let dataArray = [];
            Object.keys(dataStruct[dataS]).forEach(function (value) {
                dataArray.push(dataStruct[dataS][value]);
            });
            let color = StringToColor(dataS + dataS);
            let colorStr = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2];
            datasets.push(
                {
                    label: dataS,
                    data: dataArray,
                    color: colorStr
                });
        }
        let data = new DayHistogramResultData;
        data.datasets = datasets;
        data.dates = dates;
        return { datasets, dates };
    }

    async getVersions(): Promise<Array<string>> {
        // TODO(alexander): Cache this stuff
        let jsonResponse = await this.doRequest({
            'facets': [
                'version'
            ],
            'results_from': 0,
            'results_size': 0,
        }) as any;
        return jsonResponse.facets.version.map(x => x.term);
    }

    async getPlatforms(): Promise<Array<string>> {
        let jsonResponse = await this.doRequest({
            'facets': [
                'platform'
            ],
            'results_from': 0,
            'results_size': 0,
        }) as any;
        return jsonResponse.facets.platform.map(x => x.term);
    }

    async getProducts(): Promise<Array<string>> {
        let jsonResponse = await this.doRequest({
            'facets': [
                'product'
            ],
            'results_from': 0,
            'results_size': 0,
        }) as any;
        return jsonResponse.facets.product.map(x => x.term);
    }

    getReportCountForProduct(product: string): Promise<number> {
        return new Promise((resolve, reject) => {
            let meow = {
                'facets': [
                    'product'
                ],
                'results_from': 0,
                'results_size': 0,
                'filters': [
                    {
                        name: 'product',
                        value: product
                    }
                ]
            };

            let xhr = new XMLHttpRequest();
            let url = '/api/search';
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    console.log(jsonResponse);
                    resolve(0);
                } else if (xhr.readyState === 4) {
                    reject();
                }
            };
            xhr.send(JSON.stringify(meow));
        });
    }

    async getSignatureList(sortBy: string, descending: boolean, filters: RequestFilters, pagination: RequestPagination): Promise<RecentReportResult> {
        let meow = {
            'facets': [
                'signature'
            ],
            'results_from': (pagination.page - 1) * pagination.rowsPerPage,
            'results_size': pagination.rowsPerPage,
            'filters': [],
        };
        meow.filters = [];
        if (filters.platforms) {
            filters.platforms.forEach((value) => {
                meow.filters.push({ name: 'platform', value: value });
            });
        }
        if (filters.versions) {
            filters.versions.forEach((value) => {
                meow.filters.push({ name: 'version', value: value });
            });
        }
        if (filters.products) {
            filters.products.forEach((value) => {
                meow.filters.push({ name: 'product', value: value });
            });
        }

        if (filters.start_date) {
            meow.filters.push({
                name: 'date',
                operator: 'gte',
                value: filters.start_date.format()
            });
        }

        if (filters.end_date) {
            meow.filters.push({
                name: 'date',
                operator: 'lt',
                value: filters.end_date.format()
            });
        }
        // { 'name': 'date', 'operator': 'gte', 'value': startDate.format() },
        // { 'name': 'date', 'operator': 'lt', 'value': endDate.format() }
        let jsonResponse = await this.doRequest(meow) as any;
        let rank = 1;
        let resultArray = [];
        let totalCount = 0;
        jsonResponse.facets.signature.forEach((value) => {
            let m = {
                signature: value.term,
                count: value.count,
                percentage: value.count,
                rank: rank,
                signature_uri: encodeURI(value.term)
            };
            totalCount += value.count;
            resultArray.push(m);
            ++rank;
        });
        resultArray.forEach((value) => {
            value.percentage = value.percentage / totalCount;
        });
        return { items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: totalCount };
    }

    async getReportList(sortBy: string, descending: boolean, filters: RequestFilters, pagination: RequestPagination): Promise<RecentReportResult> {
        let meow = {
            'columns': ['signature', 'product', 'version'],
            'results_from': (pagination.page - 1) * pagination.rowsPerPage,
            'results_size': pagination.rowsPerPage,
            'sort': { 'field': sortBy == null ? 'date' : sortBy, 'asc': !descending },
            'facets': [
                'product'
            ],
            filters: []
        };
        meow.filters = [];
        if (filters.platforms) {
            filters.platforms.forEach((value) => {
                meow.filters.push({ name: 'platform', value: value });
            });
        }
        if (filters.versions) {
            filters.versions.forEach((value) => {
                meow.filters.push({ name: 'version', value: value });
            });
        }
        if (filters.products) {
            filters.products.forEach((value) => {
                meow.filters.push({ name: 'product', value: value });
            });
        }
        if (filters.start_date) {
            meow.filters.push({
                name: 'date',
                operator: 'gte',
                value: filters.start_date.format()
            });
        }

        if (filters.end_date) {
            meow.filters.push({
                name: 'date',
                operator: 'lt',
                value: filters.end_date.format()
            });
        }

        let jsonResponse = await this.doRequest(meow) as any;
        let resultArray = [];
        jsonResponse.hits.forEach((hit) => {
            const date = hit.processed_crash.crash_date && hit.processed_crash.crash_date !== undefined ? hit.processed_crash.crash_date : hit.processed_crash.date_processed;
            resultArray.push(
                {
                    crash_id: hit.crash_id,
                    date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
                    signature: hit.processed_crash.signature,
                    product: hit.processed_crash.product,
                    version: hit.processed_crash.version,
                    platform: hit.processed_crash.os_name,
                });
        });
        if (sortBy) {
            resultArray = resultArray.sort((a, b) => {
                const sortA = a[sortBy];
                const sortB = b[sortBy];
                if (descending) {
                    if (sortA < sortB) return 1;
                    if (sortA > sortB) return -1;
                    return 0;
                } else {
                    if (sortA < sortB) return -1;
                    if (sortA > sortB) return 1;
                    return 0;
                }
            });
        }
        let totalCount = 0;
        jsonResponse.facets.product.forEach((product) => {
            totalCount += product.count;
        });
        return { items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: totalCount };
    }
}

export let api = new Api();