let vm = new Vue({
    el: '#app',
    delimiters: ['${', '}'],
    data: {
        reports_headers: [
            { text: 'Crash ID', value: 'crash_id', left: true, sortable: false },
            { text: 'Date', value: 'date' },
            { text: 'Signature', value: 'signature' },
            { text: 'Product', value: 'product' },
            { text: 'Version', value: 'version' },
            { text: 'Platform', value: 'platform' },
        ],
        reports_items: [],
        reports_pagination: {
            rowsPerPage: 15,
            descending: true
        },
        total_report_count: 0,

        os_headers: [
            { text: 'Operating System', value: 'os_name', left: true},
            { text: 'Count', value: 'count' },
            { text: 'Percentage', value: 'percentage' },
        ],
        os_items: [],
        os_pagination: {
            descending: true
        }
    },
    watch: {
      reports_pagination: {
        handler () {
            this.getReports()
            .then(data => {
                this.reports_items = data.items;
                this.reports_pagination.totalItems = data.totalReportCount;
                this.total_report_count = data.totalReportCount;
            })
        },
        deep: true
      }
    },
    mounted () {
        this.getReports()
        .then(data => {
            this.reports_items = data.items;
            this.reports_pagination.totalItems = data.totalReportCount;
            this.total_report_count = data.totalReportCount;
        })
        this.getOsStats()
        .then(data => {
            this.os_items = data.items;
        })
    },
    methods: {
        getOsStats() {
            return new Promise((resolve, reject) => {
                const { sortBy, descending, page, rowsPerPage } = this.reports_pagination
                let meow = {
                    "filters": [{
                        name: "signature",
                        value: signature
                    }],
                    "sort": { "field": sortBy == null ? "date" : sortBy, "asc": !descending },
                    "facets": [
                        "platform_pretty_version"
                    ]
                }
                console.log(meow);
                console.log("Cookie");
                let xhr = new XMLHttpRequest();
                let url = "/api/search";
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-type", "application/json");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        let jsonResponse = JSON.parse(xhr.responseText);
                        let resultArray = [];
                        console.log(jsonResponse);
                        jsonResponse.hits.forEach((hit) => {
                            let os_name = hit.processed_crash.os_name + " " + hit.processed_crash.os_version
                            if ('os_pretty_version' in hit.processed_crash) {
                                os_name = hit.processed_crash.os_pretty_version
                            }
                            resultArray.push(
                                {
                                    os_name: os_name,
                                    count: 0,
                                    percentage: 0
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
                        resolve({items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: 0});
                    } else if(xhr.readyState == 4) {
                        this.loading = false;
                        reject();
                    }
                }
                xhr.send(JSON.stringify(meow));
            });
        },
        getReports() {
            this.loading = true;
            return new Promise((resolve, reject) => {
                const { sortBy, descending, page, rowsPerPage } = this.reports_pagination
                let meow = {
                    "filters": [{
                        name: "signature",
                        value: signature
                    }],
                    "sort": { "field": sortBy == null ? "date" : sortBy, "asc": !descending },
                    "results_from": (page-1) * rowsPerPage,
                    "results_size": rowsPerPage,
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
                        resolve({items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: jsonResponse.facets.signature[0].count});
                    } else if(xhr.readyState == 4) {
                        this.loading = false;
                        reject();
                    }
                }
                xhr.send(JSON.stringify(meow));
            });
        }
    }
});