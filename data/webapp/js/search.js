
let vm = new Vue({
    el: '#app',
    delimiters: ['${', '}'],
    doHistoryUpdateForFieldUpdate: false,
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
        this.doHistoryUpdateForFieldUpdate = false;
        let historyObject = this.deparam(location.search.slice(1));
        this.selected_products = historyObject.selected_products || [];
        this.selected_versions = historyObject.selected_versions || [];
        this.selected_platforms = historyObject.selected_platforms || [];
        this.reloadResults();
        window.onpopstate = () => {
            this.doHistoryUpdateForFieldUpdate = false;
            let historyObject = this.deparam(location.search.slice(1));
            this.selected_products = historyObject.selected_products || [];
            this.selected_versions = historyObject.selected_versions || [];
            this.selected_platforms = historyObject.selected_platforms || [];
            console.log(historyObject);
        };
    },
    computed: {
        searchFieldState() {
            return {
                selected_products: this.selected_products,
                selected_versions: this.selected_versions,
                selected_platforms: this.selected_platforms,
            }
        }
    },
    methods: {
        param(a) {
              var s = [], rbracket = /\[\]$/,
            isArray = function (obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            }, add = function (k, v) {
                v = typeof v === 'function' ? v() : v === null ? '' : v === undefined ? '' : v;
                s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
            }, buildParams = function (prefix, obj) {
                var i, len, key;

                if (prefix) {
                    if (isArray(obj)) {
                        for (i = 0, len = obj.length; i < len; i++) {
                            if (rbracket.test(prefix)) {
                                add(prefix, obj[i]);
                            } else {
                                buildParams(prefix + '[' + (typeof obj[i] === 'object' ? i : '') + ']', obj[i]);
                            }
                        }
                    } else if (obj && String(obj) === '[object Object]') {
                        for (key in obj) {
                            buildParams(prefix + '[' + key + ']', obj[key]);
                        }
                    } else {
                        add(prefix, obj);
                    }
                } else if (isArray(obj)) {
                    for (i = 0, len = obj.length; i < len; i++) {
                        add(obj[i].name, obj[i].value);
                    }
                } else {
                    for (key in obj) {
                        buildParams(key, obj[key]);
                    }
                }
                return s;
            };

        return buildParams('', a).join('&').replace(/%20/g, '+');
        },
        deparam(params, coerce) {
            var obj = {},
                coerce_types = { 'true': !0, 'false': !1, 'null': null };

            // Iterate over all name=value pairs.
            params.replace(/\+/g, ' ').split('&').forEach(function (v, j) {
                var param = v.split('='),
                    key = decodeURIComponent(param[0]),
                    val,
                    cur = obj,
                    i = 0,

                    // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
                    // into its component parts.
                    keys = key.split(']['),
                    keys_last = keys.length - 1;

                // If the first keys part contains [ and the last ends with ], then []
                // are correctly balanced.
                if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
                    // Remove the trailing ] from the last keys part.
                    keys[keys_last] = keys[keys_last].replace(/\]$/, '');

                    // Split first keys part into two parts on the [ and add them back onto
                    // the beginning of the keys array.
                    keys = keys.shift().split('[').concat(keys);

                    keys_last = keys.length - 1;
                } else {
                    // Basic 'foo' style key.
                    keys_last = 0;
                }

                // Are we dealing with a name=value pair, or just a name?
                if (param.length === 2) {
                    val = decodeURIComponent(param[1]);

                    // Coerce values.
                    if (coerce) {
                        val = val && !isNaN(val) ? +val              // number
                            : val === 'undefined' ? undefined         // undefined
                                : coerce_types[val] !== undefined ? coerce_types[val] // true, false, null
                                    : val;                                                // string
                    }

                    if (keys_last) {
                        // Complex key, build deep object structure based on a few rules:
                        // * The 'cur' pointer starts at the object top-level.
                        // * [] = array push (n is set to array length), [n] = array if n is 
                        //   numeric, otherwise object.
                        // * If at the last keys part, set the value.
                        // * For each keys part, if the current level is undefined create an
                        //   object or array based on the type of the next keys part.
                        // * Move the 'cur' pointer to the next level.
                        // * Rinse & repeat.
                        for (; i <= keys_last; i++) {
                            key = keys[i] === '' ? cur.length : keys[i];
                            cur = cur[key] = i < keys_last
                                ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : [])
                                : val;
                        }

                    } else {
                        // Simple key, even simpler rules, since only scalars and shallow
                        // arrays are allowed.

                        if (Array.isArray(obj[key])) {
                            // val is already an array, so push on the next value.
                            obj[key].push(val);

                        } else if (obj[key] !== undefined) {
                            // val isn't an array, but since a second value has been specified,
                            // convert val into an array.
                            obj[key] = [obj[key], val];

                        } else {
                            // val is a scalar.
                            obj[key] = val;
                        }
                    }

                } else if (key) {
                    // No value was defined, so set something meaningful.
                    obj[key] = coerce
                        ? undefined
                        : '';
                }
            });

            return obj;
        },
        updateHistory() {
            let historyObject = { selected_products: this.selected_products, selected_versions: this.selected_versions, selected_platforms: this.selected_platforms };
            window.history.pushState(historyObject, null, "/search?" + this.param(historyObject));
        },
        reloadResults() {
            this.getSignatureList()
                .then(data => {
                    this.search_result_facet_items = data.items;
                }).catch(() => {
                    this.search_result_facet_items = [];
                });
            this.getReportList(true)
                .then(data => {
                    this.search_result_report_items = data.items;
                    this.search_result_report_count = data.totalReportCount;
                }).catch(() => {
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
                    } else if (xhr.readyState == 4) {
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
                    "results_from": (page - 1) * rowsPerPage,
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
                        this.search_result_report_loading = false;
                        let totalCount = 0;
                        jsonResponse.facets.product.forEach((product) => {
                            totalCount += product.count;
                        });
                        resolve({ items: resultArray, loadedReportCount: jsonResponse.hits.length, totalReportCount: totalCount });
                    } else if (xhr.readyState == 4) {
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
        search_result_report_pagination: {
            handler(data) {
                this.getReportList(true)
                    .then(data => {
                        this.search_result_report_items = data.items;
                        this.search_result_report_count = data.totalReportCount;
                    }).catch(() => {
                        this.search_result_report_items = [];
                    });
            },
            deep: true
        },
        searchFieldState: function(val) {
            if(this.doHistoryUpdateForFieldUpdate) {
                this.updateHistory();
            }
            this.doHistoryUpdateForFieldUpdate = true;
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