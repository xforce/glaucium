let vm = new Vue({
  el: '#app',
  delimiters: ['${', '}'],
  data: {
    reports_page: 0,
    reports_pages: 0,
    has_pages: false,
    visisble_reports: [
    ],
    reports_headers: [
            { text: 'Crash ID', value: 'crash_id', left: true, sortable: false },
            { text: 'Date', value: 'date' },
            { text: 'Signature', value: 'signature' },
            { text: 'Product', value: 'product' },
            { text: 'Version', value: 'version' },
            { text: 'Platform', value: 'platform' },
    ],
    reports_items: [],
  }
});

function fetchRecentReports() {
    let endDate = moment();
    let startDate = moment().subtract(7, 'd');
    let meow = {
        "filters": [{
        name: "signature",
        value: signature
        }],
        "results_from": 0,
        "results_size": 50,
        "facets": [
            "signature"
        ]
    }
    let xhr = new XMLHttpRequest();
    let url = "/api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
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
            vm.reports_items = resultArray;
            vm.loaded_report_count = jsonResponse.hits.length;
            vm.total_report_count = jsonResponse.total;
            vm.reports_pages = Math.ceil(vm.loaded_report_count / 2);
            vm.has_pages = vm.reports_pages > 0;
        }
    }
    xhr.send(JSON.stringify(meow));
}

fetchRecentReports();