import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';

import { api } from '../../api';
import moment from 'moment';
import * as numeral from 'numeral';

@Component({
    template: require('./signature.html')
})
export class Signature extends Vue {

    @Prop()
    sig: string;

    os_headers = [
        { text: 'Operating System', value: 'os_name', align: 'left' },
        { text: 'Count', value: 'count' },
        { text: 'Percentage', value: 'percentage' },
    ];
    os_items = [];

    version_headers = [
        { text: 'Version', value: 'version', align: 'left' },
        { text: 'Count', value: 'count' },
        { text: 'Percentage', value: 'percentage' },
    ];
    version_items = [];

    reports_headers = [
        { text: 'Crash ID', value: 'crash_id', align: 'left', sortable: false },
        { text: 'Date', value: 'date', desc: true, sortable: false },
        { text: 'Signature', value: 'signature', sortable: false },
        { text: 'Product', value: 'product', sortable: false },
        { text: 'Version', value: 'version', sortable: false },
        { text: 'Platform', value: 'platform', sortable: false },
    ];
    reports_pagination = {
        descending: true,
        sortBy: null,
        page: 1,
        rowsPerPage: 25,
        totalItems: 0
    };
    reports_items = [];

    @Watch('reports_pagination', {deep: true})
    onReportPaginationChanged(value) {
        this.getReports();
    }

    mounted() {
        this.getOSStats();
        this.getVersionStats();
        this.getReports();
    }

    percentage(value) {
        return numeral(value).format('0%');
    }

    async getVersionStats() {
        let meow = {
            'filters': [{
                name: 'signature',
                value: this.sig
            }],
            'results_from': 0,
            'results_size': 0,
            'sort': { 'field': 'date', 'asc': false },
            'facets': [
                'version'
            ]
        };
        let xhr = new XMLHttpRequest();
        let url = '/api/search';
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                let jsonResponse = JSON.parse(xhr.responseText);
                let resultArray = [];
                console.log(jsonResponse);
                let totalCount: number = 0;
                jsonResponse.facets.version.forEach((entry) => {
                    totalCount += entry.count;
                    resultArray.push(
                    {
                        version: entry.term,
                        count: entry.count,
                        percentage: 0
                    });
                });
                resultArray.forEach((entry) => {
                    entry.percentage = entry.count / totalCount;
                });
                this.version_items = resultArray;
            }
        };
        xhr.send(JSON.stringify(meow));
    }

    async getOSStats() {
        let meow = {
            'filters': [{
                name: 'signature',
                value: this.sig
            }],
            'results_from': 0,
            'results_size': 0,
            'sort': { 'field': 'date', 'asc': false },
            'facets': [
                'platform_pretty_version'
            ]
        };
        let xhr = new XMLHttpRequest();
        let url = '/api/search';
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                let jsonResponse = JSON.parse(xhr.responseText);
                let resultArray = [];
                console.log(jsonResponse);
                let totalCount: number = 0;
                jsonResponse.facets.platform_pretty_version.forEach((entry) => {
                    totalCount += entry.count;
                    resultArray.push(
                    {
                        os_name: entry.term,
                        count: entry.count,
                        percentage: 0
                    });
                });
                resultArray.forEach((entry) => {
                    entry.percentage = entry.count / totalCount;
                });
                this.os_items = resultArray;
            }
        };
        xhr.send(JSON.stringify(meow));
    }

    async getReports() {
        const { sortBy, descending, page, rowsPerPage } = this.reports_pagination;
        let meow = {
            'filters': [{
                name: 'signature',
                value: this.sig
            }],
            'sort': { 'field': sortBy == null ? 'date' : sortBy, 'asc': !descending },
            'results_from': (page - 1) * rowsPerPage,
            'results_size': rowsPerPage,
            'facets': [
                'signature'
            ]
        };
        let xhr = new XMLHttpRequest();
        let url = '/api/search';
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                let jsonResponse = JSON.parse(xhr.responseText);
                let resultArray = [];
                jsonResponse.hits.forEach((hit) => {
                    const date = hit.processed_crash.crash_time && hit.processed_crash.crash_time !== undefined ? hit.processed_crash.crash_time : hit.processed_crash.date_processed;
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
                this.reports_items = resultArray;
                this.reports_pagination.totalItems = jsonResponse.facets.signature[0].count;
            }
        };
        xhr.send(JSON.stringify(meow));
    }
}