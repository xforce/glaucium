let vm = new Vue({
    el: '#app',
    delimiters: ['${', '}'],
    data: {
        loaded_report_count: 0,
        total_report_count: 0,
        recent_reports_headers: [
            { text: 'Crash ID', value: 'crash_id', left: true, sortable: false },
            { text: 'Date', value: 'date', desc: true },
            { text: 'Signature', value: 'signature' },
            { text: 'Product', value: 'product' },
            { text: 'Version', value: 'version' },
            { text: 'Platform', value: 'platform' },
        ],
        loading: false,
        recent_reports_items: [],
        recent_reports_pagination: {
            descending: true,
        },
    },
    methods: {
       getRecentReports(reload_data) {
           this.loading = true;
           return new Promise((resolve, reject) => {
               const { sortBy, descending, page, rowsPerPage } = this.recent_reports_pagination
               if(reload_data) {
                    let meow = {
                        "columns": ["signature", "product", "version"],
                        "results_from": 0,
                        "results_size": 50,
                        "sort": { "field": "date", "asc": false },
                        "facets": [
                            "signature"
                        ],
                        "histograms": {
                            "date": "version"
                        }
                    }
                    let xhr = new XMLHttpRequest();
                    let url = "api/search";
                    xhr.open("POST", url, true);
                    xhr.setRequestHeader("Content-type", "application/json");
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            let jsonResponse = JSON.parse(xhr.responseText);
                            let resultArray = [];
                            jsonResponse.hits.forEach((hit) => {
                                resultArray.push(
                                    {
                                        crash_id: hit.crash_id,
                                        date: moment(hit.processed_crash.date_processed).format("YYYY-MM-DD HH:mm:ss"),
                                        signature: hit.processed_crash.signature,
                                        product: hit.processed_crash.product,
                                        version: hit.processed_crash.version,
                                        platform: hit.processed_crash.os_name,
                                    });
                            });
                            if (sortBy) {
                                resultArray = resultArray.sort((a, b) => {
                                const sortA = a[sortBy]
                                const sortB = b[sortBy]
                                if (descending) {
                                    if (sortA < sortB) return 1
                                    if (sortA > sortB) return -1
                                    return 0
                                } else {
                                    if (sortA < sortB) return -1
                                    if (sortA > sortB) return 1
                                    return 0
                                }
                                })
                            }
                            this.loading = false;
                            resolve({items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: jsonResponse.total});
                        } else if(xhr.readyState == 4) {
                            this.loading = false;
                            reject();
                        }
                    };
                    xhr.send(JSON.stringify(meow));
               } else {
                   let resultArray = this.recent_reports_items;
                   if (sortBy) {
                        resultArray = resultArray.sort((a, b) => {
                        const sortA = a[sortBy]
                        const sortB = b[sortBy]
                        if (descending) {
                            if (sortA < sortB) return 1
                            if (sortA > sortB) return -1
                            return 0
                        } else {
                            if (sortA < sortB) return -1
                            if (sortA > sortB) return 1
                            return 0
                        }
                        })
                    }
                    this.loading = false;
                    resolve({items: resultArray, loadedReportCount: this.loaded_report_count, totalReportCount: this.total_report_count});
               }
           })
        }
    },
    mounted () {
        this.getRecentReports(true)
        .then(data => {
            this.recent_reports_items = data.items;
            this.loaded_report_count = data.loadedReportCount;
            this.total_report_count = data.totalReportCount;
        })
    },
    watch: {
      recent_reports_pagination: {
        handler () {
          this.getRecentReports(false)
            .then(data => {
                this.recent_reports_items = data.items;
                this.loaded_report_count = data.loadedReportCount;
                this.total_report_count = data.totalReportCount;
            })
        },
        deep: true
      }
    },
});

function GetDateRangePrior(numberOfDays) {
    let dateArray = new Array();
    for (i = 0; numberOfDays >= 0; ++i) {
        dateArray.push(moment().subtract(numberOfDays, 'd').format('MMM Do'));
        --numberOfDays;
    }
    return dateArray;
}

function dateIsoFormat(date) {
    return date.toISOString().substring(0, 10);
}

var stringToColor = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colors =[]
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colors.push(parseInt(value.toString(16).substr(-2), 16))
    }
    return colors;
}

function loadDayHistogramData(days) {
    let endDate = moment();
    let startDate = moment().subtract(days, 'd');
    let meow = {
        "columns": ["signature", "product", "version"],
        "filters": [
            { "name": "date", "operator": "gte", "value": startDate.format() },
            { "name": "date", "operator": "lt", "value": endDate.format() }
        ],
        "sort":{ "field": "date", "asc": false },
        "facets": [
            "signature"
        ],
        "histograms": {
            "date": "version"
        }
    }

    let versions = [];
    let meow_version = {
        "facets": [
            "version"
        ],
        "results_from": 0,
        "results_size": 0,
    };

    let xhr_version = new XMLHttpRequest();
    let url = "api/search";
    xhr_version.open("POST", url, true);
    xhr_version.setRequestHeader("Content-type", "application/json");
    xhr_version.onreadystatechange = function () {
        if (xhr_version.readyState == 4 && xhr_version.status == 200) {
            let jsonResponse = JSON.parse(xhr_version.responseText);
            versions = []
            jsonResponse.facets.version.forEach((value) => {
                versions.push(value.term);
            });
            let xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    let jsonResponse = JSON.parse(xhr.responseText);
                    let dates = GetDateRangePrior(days);
                    let ctx = document.getElementById("crash-stat-chart-"+days+"days");
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
                            let day = dateIsoFormat(new Date(currentDay));
                            dataStruct[version][day] = 0;
                            ++counter;
                            currentDay += 24 * 60 * 60 * 1000;
                        }
                    });
                    // Nan, if the = versionCount.count below is changed to +=
                    for (histogramIndex in jsonResponse.histograms.date) {
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
                                betaVersions.forEach(function (betaVersion) {
                                    if (version.indexOf(betaVersion) > -1) {
                                        baseVersion = betaVersion;
                                    }
                                });
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
                        let color = stringToColor(dataS+dataS);
                        colorStr = "rgba("+color[0]+","+color[1]+","+color[2]
                        datasets.push(
                            {
                                label: dataS,
                                data: dataArray,
                                fill: true,
                                lineTension: 0.3,
                                backgroundColor: colorStr + ",0.4)",
                                borderColor: colorStr+",1)",
                                borderCapStyle: 'butt',
                                borderDash: [],
                                borderDashOffset: 0.0,
                                borderJoinStyle: 'miter',
                                pointBorderColor: colorStr+",1)",
                                pointBackgroundColor: "#fff",
                                pointBorderWidth: 1,
                                pointHoverRadius: 5,
                                pointHoverBackgroundColor: colorStr+"1)",
                                pointHoverBorderColor: "rgba(220,220,220,1)",
                                pointHoverBorderWidth: 2,
                                pointRadius: 1,
                                pointHitRadius: 10,
                            });
                    }

                    let myChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: datasets
                        },
                        options: {
                            scales: {
                                yAxes: [{
                                    gridLines: {
                                        color: "rgba(0, 0, 0, 0.5)",
                                    },
                                    ticks: {
                                        beginAtZero: true
                                    }
                                }],
                                xAxes: [{
                                    gridLines: {
                                        color: "rgba(0, 0, 0, 0.5)",
                                    }
                                }]
                            }
                        }
                    });
                }
            }
            xhr.send(JSON.stringify(meow));
        }
    }
    xhr_version.send(JSON.stringify(meow_version));

    document.getElementById(days+"-day-reports-card-view-reports").onclick = function () {
        document.location = "/search";
    };
}



loadDayHistogramData(1);
loadDayHistogramData(7);
loadDayHistogramData(14);
