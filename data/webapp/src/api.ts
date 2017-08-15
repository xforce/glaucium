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
}

class Api {
    getRecentReports(sortBy: string, descending: boolean): Promise<RecentReportResult> {
        return new Promise((resolve, reject) => {
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
            let xhr = new XMLHttpRequest();
            let url = 'api/search';
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
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
                    resolve({ items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: jsonResponse.total });
                } else if (xhr.readyState === 4) {
                    reject();
                }
            };
            xhr.send(JSON.stringify(meow));
        });
    }

    getDayHistogramData(days): Promise<DayHistogramResultData> {
        return new Promise((resolve, reject) => {
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

            let versions = [];
            let meow_version = {
                'facets': [
                    'version'
                ],
                'results_from': 0,
                'results_size': 0,
            };

            let xhr_version = new XMLHttpRequest();
            let url = 'api/search';
            xhr_version.open('POST', url, true);
            xhr_version.setRequestHeader('Content-type', 'application/json');
            xhr_version.onreadystatechange = function () {
                if (xhr_version.readyState === 4 && xhr_version.status === 200) {
                    let jsonResponse = JSON.parse(xhr_version.responseText);
                    versions = [];
                    jsonResponse.facets.version.forEach((value) => {
                        versions.push(value.term);
                    });
                    let xhr = new XMLHttpRequest();
                    xhr.open('POST', url, true);
                    xhr.setRequestHeader('Content-type', 'application/json');
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            let jsonResponse = JSON.parse(xhr.responseText);
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
                            resolve({ datasets, dates });
                        } else if (xhr.readyState === 4) {
                            reject();
                        }
                    };
                    xhr.send(JSON.stringify(meow));
                }
            };
            xhr_version.send(JSON.stringify(meow_version));
        });
    }

    getVersions(): Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            let meow = {
                'facets': [
                    'version'
                ],
                'results_from': 0,
                'results_size': 0,
            };

            let xhr = new XMLHttpRequest();
            let url = '/api/search';
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    let versions = [];
                    jsonResponse.facets.version.forEach((value) => {
                        versions.push(value.term);
                    });
                    resolve(versions);
                } else if (xhr.readyState === 4) {
                    reject();
                }
            };
            xhr.send(JSON.stringify(meow));
        });
    }

    getPlatforms(): Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            let meow = {
                'facets': [
                    'platform'
                ],
                'results_from': 0,
                'results_size': 0,
            };

            let xhr = new XMLHttpRequest();
            let url = '/api/search';
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    let versions = [];
                    jsonResponse.facets.platform.forEach((value) => {
                        versions.push(value.term);
                    });
                    resolve(versions);
                } else if (xhr.readyState === 4) {
                    reject();
                }
            };
            xhr.send(JSON.stringify(meow));
        });
    }

    getProducts(): Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            let meow = {
                'facets': [
                    'product'
                ],
                'results_from': 0,
                'results_size': 0,
            };

            let xhr = new XMLHttpRequest();
            let url = '/api/search';
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    let versions = [];
                    jsonResponse.facets.product.forEach((value) => {
                        versions.push(value.term);
                    });
                    resolve(versions);
                } else if (xhr.readyState === 4) {
                    reject();
                }
            };
            xhr.send(JSON.stringify(meow));
        });
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

    getSignatureList(sortBy: string, descending: boolean, filters: RequestFilters,  pagination: RequestPagination): Promise<RecentReportResult> {
        return new Promise((resolve, reject) => {
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

            let xhr = new XMLHttpRequest();
            let url = '/api/search';
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
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
                    resolve({ items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: totalCount });
                } else if (xhr.readyState === 4) {
                    reject();

                }
            };
            xhr.send(JSON.stringify(meow));
        });
    }

    getReportList(sortBy: string, descending: boolean, filters: RequestFilters,  pagination: RequestPagination): Promise<RecentReportResult> {
            return new Promise((resolve, reject) => {
                sleep(50000);
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
                let xhr = new XMLHttpRequest();
                let url = 'api/search';
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-type', 'application/json');
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        let jsonResponse = JSON.parse(xhr.responseText);
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
                        resolve({ items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: totalCount });
                    } else if (xhr.readyState === 4) {
                        console.log('API reported ' + xhr.status);
                        reject();
                    }
                };
                xhr.send(JSON.stringify(meow));
            });
        }
}

export let api = new Api();