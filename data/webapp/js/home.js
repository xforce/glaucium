function GetDateRangePrior(numberOfDays) {
    let dateArray = new Array();
    for(i = 0; numberOfDays >= 0; ++i) {
        dateArray.push(moment().subtract(numberOfDays, 'd').format('MMM Do'));
        --numberOfDays;
    }
    return dateArray;
}

function dateIsoFormat(date) {
    return date.toISOString().substring(0, 10);
}


function load7DayHistogramData() {
    let endDate = moment();
    let startDate = moment().subtract(7, 'd');
    let meow = {
        "columns": ["signature","product","version"],
        "filters": [
            {"name": "date","operator": "gte","value" : startDate.format()},
            {"name": "date","operator": "lt","value" : endDate.format()}
        ],
        "sort": [
            {"field": "date","asc": true}
        ],
        "facets": [
            "signature"
        ],
        "histograms": {
            "date": "version"
        }
    }

    let versions = ["1.0", "0.9.9"];

    let xhr = new XMLHttpRequest();
    let url = "api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            let dates = GetDateRangePrior(7);
            let ctx = document.getElementById("crash-stat-chart-7days");
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
            for(histogramIndex in jsonResponse.histograms.date) {
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
            console.log(dataStruct);
            for(let dataS in dataStruct) {
                let dataArray = [];
                Object.keys(dataStruct[dataS]).forEach(function(value) {
                    dataArray.push(dataStruct[dataS][value]);
                });
                datasets.push(
                {
                        label: dataS,
                        data: dataArray,
                        fill: false,
                        lineTension: 0.1,
                        backgroundColor: "rgba(75,192,192,0.4)",
                        borderColor: "rgba(75,192,192,1)",
                        borderCapStyle: 'butt',
                        borderDash: [],
                        borderDashOffset: 0.0,
                        borderJoinStyle: 'miter',
                        pointBorderColor: "rgba(75,192,192,1)",
                        pointBackgroundColor: "#fff",
                        pointBorderWidth: 1,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: "rgba(75,192,192,1)",
                        pointHoverBorderColor: "rgba(220,220,220,1)",
                        pointHoverBorderWidth: 2,
                        pointRadius: 1,
                        pointHitRadius: 10,
                });
            }
            console.log(datasets);
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
                                color: "rgba(255, 255, 255, 0.5)",
                            },
                            ticks: {
                                beginAtZero:true
                            }
                        }],
                        xAxes: [{
                            gridLines: {
                                color: "rgba(255, 255, 255, 0.5)",
                            }
                        }]
                    }
                }
            });
        }
    }
    xhr.send(JSON.stringify(meow));

    document.getElementById("7-day-reports-card-view-reports").onclick = function() {
        document.location = "/search";
    }; 
}


Chart.defaults.global.defaultFontColor = "#fff";
let vm = new Vue({
  el: '#app',
  delimiters: ['${', '}'],
  data: {
    loaded_report_count: 0,
    total_report_count: 0,
      recent_reports_headers: [
          { text: 'Crash ID', value: 'crash_id',  left: true, sortable: false },
          { text: 'Date', value: 'date' },
          { text: 'Signature', value: 'signature' },
          { text: 'Product', value: 'product' },
          { text: 'Version', value: 'version' },
          { text: 'Platform', value: 'platform' },
      ],
      recent_reports_items: [],
  }
});

function fetchRecentReports() {
    let endDate = moment();
    let startDate = moment().subtract(7, 'd');
    let meow = {
        "columns": ["signature","product","version"],
        "results_from": 0,
        "results_size": 50,
        "sort": [
            {"field": "date","asc": true}
        ],
        "facets": [
            "signature"
        ],
        "histograms": {
            "date": "version"
        }
    }

    let versions = ["1.0", "0.9.9"];

    let xhr = new XMLHttpRequest();
    let url = "api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            console.log(jsonResponse);
            let resultArray = [];
            jsonResponse.hits.forEach((hit) => {
                resultArray.push(
                   {
                        crash_id: hit.crash_id,
                        date: moment(hit.processed_crash.date_processed).format("YYYY-MM-DD HH:MM:SS"),
                        signature: hit.processed_crash.signature,
                        product: hit.processed_crash.product,
                        version: hit.processed_crash.version,
                        platform: hit.processed_crash.platform,
                    });
            });
            vm.recent_reports_items = resultArray;
            vm.loaded_report_count = jsonResponse.hits.length;
            vm.total_report_count = jsonResponse.total;
        }
    }
    xhr.send(JSON.stringify(meow));

}

fetchRecentReports();
load7DayHistogramData();