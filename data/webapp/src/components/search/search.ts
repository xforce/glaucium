import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { api } from '../../api';
import * as numeral from 'numeral';
import moment from 'moment';

@Component({
    template: require('./search.html')
})
export class Search extends Vue {
    facet_headers = [
        { text: 'Rank', value: 'rank', align: 'left' },
        { text: 'Signature', value: 'signature' },
        { text: 'Count', value: 'count' },
        { text: 'Percentage', value: 'percentage' }
    ];
    facet_items = [];
    facet_pagination = {
        descending: true,
        rowsPerPage: 500,
        page: 1,
        sortBy: 'rank',
        totalItems: 0,
    };
    selected_version = 'All';

    start_date_menu = false;
    start_date = null;

    end_date_menu = false;
    end_date = null;

    report_loading = false;
    report_headers = [
        { text: 'Crash ID', value: 'crash_id', align: 'left', sortable: false },
        { text: 'Date', value: 'date', desc: true },
        { text: 'Signature', value: 'signature' },
        { text: 'Product', value: 'product' },
        { text: 'Version', value: 'version' },
        { text: 'Platform', value: 'platform' },
    ];
    report_items = [];
    report_count = 0;
    report_pagination = {
        descending: true,
        rowsPerPage: 50,
        page: 1,
        sortBy: 'date',
        totalItems: 0
    };

    products = [];
    platforms = [];
    versions = [];

    selected_products = null;
    selected_platforms = null;
    selected_versions = null;

    doHistoryUpdateForFieldUpdate = false;

    async loadInitialData() {
        this.versions = await api.getVersions();
        this.products = await api.getProducts();
        this.platforms = await api.getPlatforms();
    }

    @Watch('selected_products')
    onSelectedProductsChanged() {
        this.searchChanged();
    }

    @Watch('selected_platforms')
    onSelectedPlatformsChanged() {
        this.searchChanged();
    }

    @Watch('selected_versions')
    onSelectedVersionsChanged() {
        this.searchChanged();
    }

    @Watch('report_pagination', { deep: true })
    onReportPaginationChanged(value) {
        this.loadReports();
    }

    @Watch('start_date')
    onStartDateChanged() {
        this.searchChanged();
    }

    @Watch('end_date')
    onEndDateChanged() {
        this.searchChanged();
    }


    searchChanged() {
        if (this.doHistoryUpdateForFieldUpdate) {
            this.report_pagination.page = 1;
            this.loadSignatures();
            this.loadReports();
            this.updateHistory();
        }
    }


    mounted() {
        this.doHistoryUpdateForFieldUpdate = false;
        let historyObject = this.deparam(location.href.slice(location.href.indexOf('#/search?') + '#/search?'.length), null);
        this.selected_products = historyObject.selected_products || [];
        this.selected_versions = historyObject.selected_versions || [];
        this.selected_platforms = historyObject.selected_platforms || [];
        this.start_date = historyObject.start_date || null;
        this.end_date = historyObject.end_date || null;
        this.loadInitialData();
        this.loadSignatures();
        this.loadReports();
        this.$nextTick(() => {
            this.$nextTick(() => {
                this.doHistoryUpdateForFieldUpdate = true;
            });
        });
        window.onpopstate = () => {
            this.doHistoryUpdateForFieldUpdate = false;
            let historyObject = this.deparam(location.href.slice(location.href.indexOf('#/search?') + '#/search?'.length), null);
            this.selected_products = historyObject.selected_products || [];
            this.selected_versions = historyObject.selected_versions || [];
            this.selected_platforms = historyObject.selected_platforms || [];
            this.start_date = historyObject.start_date || null;
            this.end_date = historyObject.end_date || null;
            this.loadSignatures();
            this.loadReports();
            this.$nextTick(() => {
                this.$nextTick(() => {
                    this.doHistoryUpdateForFieldUpdate = true;
                });
            });
        };
    }

    percentage(value) {
        return numeral(value).format('0%');
    }

    updateHistory() {
        let historyObject = { selected_products: this.selected_products, selected_versions: this.selected_versions, selected_platforms: this.selected_platforms, start_date: this.start_date, end_date: this.end_date };
        window.history.pushState(historyObject, null, '/#/search?' + this.param(historyObject));
    }

    param(a) {
        let s = [], rbracket = /\[\]$/,
            isArray = function (obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            }, add = function (k, v) {
                v = typeof v === 'function' ? v() : v === null ? '' : v === undefined ? '' : v;
                s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
            }, buildParams = function (prefix, obj) {
                let i, len, key;

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
    }

    deparam(params, coerce): any {
        let obj = [],
            coerce_types = { 'true': !0, 'false': !1, 'null': null };

        // Iterate over all name=value pairs.
        params.replace(/\+/g, ' ').split('&').forEach(function (v, j) {
            let param = v.split('='),
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
                        key = keys[i] === '' ? cur.length.toString() : keys[i];
                        cur = cur[key] = i < keys_last
                            ? cur[key] || (keys[i + 1] && isNaN(Number(keys[i + 1])) ? {} : [])
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
    }

    async loadSignatures() {
        try {
            const filter_versions = this.selected_versions;
            const filter_platforms = this.selected_platforms;
            const filter_products = this.selected_products;
            const start_date = this.start_date ? moment(this.start_date) : null;
            const end_date = this.end_date ? moment(this.end_date) : null;
            let data = await api.getSignatureList(
                this.facet_pagination.sortBy,
                this.facet_pagination.descending,
                {
                    versions: filter_versions,
                    platforms: filter_platforms,
                    products: filter_products,
                    start_date: start_date,
                    end_date: end_date
                },
                {
                    page: this.facet_pagination.page,
                    rowsPerPage: this.facet_pagination.rowsPerPage
                }
            );
            this.facet_items = data.items;
            this.facet_pagination.totalItems = data.items.length;

        } catch (e) {
            console.log(e);
        }
    }

    async loadReports() {
        try {
            const filter_versions = this.selected_versions;
            const filter_platforms = this.selected_platforms;
            const filter_products = this.selected_products;
            const start_date = this.start_date ? moment(this.start_date) : null;
            const end_date = this.end_date ? moment(this.end_date) : null;
            let data = await api.getReportList(
                this.report_pagination.sortBy,
                this.report_pagination.descending,
                {
                    versions: filter_versions,
                    platforms: filter_platforms,
                    products: filter_products,
                    start_date: start_date,
                    end_date: end_date
                },
                {
                    page: this.report_pagination.page,
                    rowsPerPage: this.report_pagination.rowsPerPage
                }
            );
            this.report_items = data.items;
            this.report_pagination.totalItems = data.totalReportCount;
            this.report_count = data.totalReportCount;
        } catch (e) {
            console.log(e);
        }
    }
}