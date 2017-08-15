import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';

import { api } from '../../api';

import * as numeral from 'numeral';

@Component({
    template: require('./reports.html')
})
export class Reports extends Vue {
    facet_headers = [
        { text: 'Rank', value: 'rank', align: 'left' },
        { text: 'Signature', value: 'signature' },
        { text: 'Count', value: 'count' },
        { text: 'Percentage', value: 'percentage' }
    ];
    facet_items = [];
    facet_pagination = {
        descending: false,
        rowsPerPage: 500,
        page: 1,
        sortBy: 'rank',
        totalItems: 0,
    };
    versions = [];
    products = [];
    selected_version = 'All';
    selected_product = 'All';

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

    async mounted() {
        this.loadInitialData();
    }

    @Watch('report_pagination', {deep: true})
    onReportPaginationChanged(value) {
        this.loadReports();
    }

    async loadInitialData() {
        try {
            this.versions = await api.getVersions();
            this.products = await api.getProducts();
        } catch (e) {
            console.log(e);
        }
        await this.loadReports();
        await this.loadSignatures();
    }

    percentage(value) {
        return numeral(value).format('0%');
    }

    async loadSignatures() {
        try {
            let filter_version = this.selected_version !== 'All' ? [this.selected_version] : null;
            let filter_product = this.selected_product !== 'All' ? [this.selected_product] : null;
            let data = await api.getSignatureList(
                this.facet_pagination.sortBy, 
                this.facet_pagination.descending, 
                { 
                    versions: filter_version, 
                    platforms: null, 
                    products: filter_product,
                    start_date: null,
                    end_date: null
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
            let filter_version = this.selected_version !== 'All' ? [this.selected_version] : null;
            let filter_product = this.selected_product !== 'All' ? [this.selected_product] : null;
            let data = await api.getReportList(
                this.report_pagination.sortBy, 
                this.report_pagination.descending, 
                { 
                    versions: filter_version, 
                    platforms: null, 
                    products: filter_product,
                    start_date: null,
                    end_date: null
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

    onVersionSelected(e) {
        if (this.selected_version !== e) {
            this.selected_version = e;
            this.loadReports();
        }
    }
    onProductSelected(e) {
        if (this.selected_product !== e) {
            this.selected_product = e;
            this.loadReports();
        }
    }

}