

let vm = new Vue({
    el: '#app',
    delimiters: ['${', '}'],
    data: {
        states: [
            "Meow",
            "Cookie",
        ],
        products: [],
        versions: [],
        platforms: [],
        selected_products: [],
        selected_versions: [],
        selected_platforms: [],
        menu: false,
        end_date_menu: false,
        e3: null,
        end_date: null,
        search_result_facet_headers: [
            { text: 'Rank', value: 'rank', left: true },
            { text: 'Signature', value: 'signature' },
            { text: 'Count', value: 'count' },
            { text: 'Percentage', value: 'percentage' }
        ],
        search_result_facet_items: [],
        search_result_facet_pagination: {
            rowsPerPage: 1000
        },

        search_result_report_loading: false,
        search_result_report_headers: [
            { text: 'Crash ID', value: 'crash_id', left: true, sortable: false },
            { text: 'Date', value: 'date', desc: true },
            { text: 'Signature', value: 'signature' },
            { text: 'Product', value: 'product' },
            { text: 'Version', value: 'version' },
            { text: 'Platform', value: 'platform' },
        ],
        search_result_report_items: [],
        search_result_report_count: 0,
        search_result_report_pagination: {
             descending: true,
             rowsPerPage: 50
        }
    },
    mounted() {
        this.reloadResults();
    },
    methods: {
        reloadResults() {
            this.getSignatureList()
                .then(data => {
                    this.search_result_facet_items = data.items;
                }).catch(()=> {
                    this.search_result_facet_items = [];
                });
            this.getReportList(true)
                .then(data => {
                    this.search_result_report_items = data.items;
                    this.search_result_report_count = data.totalReportCount;
                }).catch(()=> {
                    this.search_result_report_items = [];
                })
        },
        percentage(value) {
            var val = new Number(value);
            val *= 100;
            var arr = val.round(2).toFixed(2).split('.');
            arr[0] = (val < 0 ? '-' : '') + String.leftPad((val < 0 ? arr[0].substring(1) : arr[0]), 1, '0');
            arr[0] = Number.injectIntoFormat(arr[0].reverse(), '0', true).reverse();
            arr[1] = Number.injectIntoFormat(arr[1], '00%', false);
            return arr.join('.');
        },
        getSignatureList() {
            this.search_result_loading = true;
            return new Promise((resolve, reject) => {
                const { sortBy, descending, page, rowsPerPage } = this.search_result_facet_pagination
                let meow = {
                    "facets": [
                        "signature"
                    ],
                    "results_from": 0,
                    "results_size": 0,
                }
                meow.filters = [];
                this.selected_versions.forEach((value) => {
                    meow.filters.push({ name: "version", value: value });
                });
                this.selected_products.forEach((value) => {
                    meow.filters.push({ name: "product", value: value });
                });
                this.selected_platforms.forEach((value) => {
                    meow.filters.push({ name: "platform", value: value });
                });

                let xhr = new XMLHttpRequest();
                let url = "/api/search";
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-type", "application/json");
                xhr.onreadystatechange = () => {
                    if (xhr.readyState == 4 && xhr.status == 200) {
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
                            }
                            totalCount += value.count;
                            resultArray.push(m);
                            ++rank;
                        });
                        resultArray.forEach((value) => {
                            value.percentage = value.percentage / totalCount;
                        })
                        resolve({ items: resultArray });
                        this.search_result_loading = false;
                    } else if(xhr.readyState == 4) {
                        this.search_result_loading = true;
                        reject();
                        
                    }
                };
                xhr.send(JSON.stringify(meow));
            });
        },
        getReportList() {
        //this.search_result_report_loading = true;
           return new Promise((resolve, reject) => {
               const { sortBy, descending, page, rowsPerPage } = this.search_result_report_pagination
                let meow = {
                    "columns": ["signature", "product", "version"],
                    "results_from": (page-1)*rowsPerPage,
                    "results_size": rowsPerPage,
                    "sort": { "field": sortBy == null ? "date" : sortBy, "asc": !descending },
                    "facets": [
                        "product"
                    ],
                }
                meow.filters = [];
                this.selected_versions.forEach((value) => {
                    meow.filters.push({ name: "version", value: value });
                });
                this.selected_products.forEach((value) => {
                    meow.filters.push({ name: "product", value: value });
                });
                this.selected_platforms.forEach((value) => {
                    meow.filters.push({ name: "platform", value: value });
                });
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
                                    date: moment(hit.processed_crash.date_processed).format("YYYY-MM-DD HH:MM:SS"),
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
                        this.search_result_report_loading = false;
                        let totalCount = 0;
                        jsonResponse.facets.product.forEach((product) => {
                            totalCount += product.count;
                        });
                        resolve({items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: totalCount});
                    } else if(xhr.readyState == 4) {
                            this.search_result_report_loading = false;
                            console.log("API reported " + xhr.status);
                        reject();
                    }
                };
                xhr.send(JSON.stringify(meow));
           })  
        }
    },
    watch: {
        search_result_report_pagination:  {
                handler (data) {
                    this.getReportList(true)  
                    .then(data => {
                        this.search_result_report_items = data.items;
                        this.search_result_report_count = data.totalReportCount;
                    }).catch(()=> {
                        this.search_result_report_items = [];
                    });
                },
                deep: true
        },
        selected_products: function(val) {
            this.reloadResults();
        },
        selected_versions: function(val) {
            this.reloadResults();
        },
        selected_platforms: function(val) {
            this.reloadResults();
        }
    }
})

function loadProducts() {
    let meow = {
        "facets": [
            "product"
        ],
        "results_from": 0,
        "results_size": 0,
    }
    let xhr = new XMLHttpRequest();
    let url = "/api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            vm.products = []
            jsonResponse.facets.product.forEach((value) => {
                vm.products.push(value.term);
            });
        }
    }
    xhr.send(JSON.stringify(meow));
}

function loadVersions() {
    let meow = {
        "facets": [
            "version"
        ],
        "results_from": 0,
        "results_size": 0,
    };

    let xhr = new XMLHttpRequest();
    let url = "/api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            vm.versions = []
            jsonResponse.facets.version.forEach((value) => {
                vm.versions.push(value.term);
            });
        }
    }
    xhr.send(JSON.stringify(meow));
}


function loadPlatforms() {
    let meow = {
        "facets": [
            "platform"
        ],
        "results_from": 0,
        "results_size": 0,
    }
    let xhr = new XMLHttpRequest();
    let url = "api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            vm.platforms = []
            jsonResponse.facets.platform.forEach((value) => {
                vm.platforms.push(value.term);
            });
        }
    }
    xhr.send(JSON.stringify(meow));
}

loadProducts();
loadVersions();
loadPlatforms();

//setInterval(loadSignatureTable, 1000);