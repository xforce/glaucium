import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { api } from '../../api';
import * as numeral from 'numeral';

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
        sortBy: 'date',
        totalItems: 0,
    };
    selected_version = 'All';

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

    async loadInitialData() {
        this.versions = await api.getVersions();
        this.products = await api.getProducts();
        this.platforms = await api.getPlatforms();
    }

    @Watch('selected_products')
    onSelectedProductsChanged() {
        this.report_pagination.page = 1;
        this.loadSignatures();
        this.loadReports();
    }

    @Watch('selected_platforms')
    onSelectedPlatformsChanged() {
        this.report_pagination.page = 1;
        this.loadSignatures();
        this.loadReports();
    }

    @Watch('selected_versions')
    onSelectedVersionsChanged() {
        this.report_pagination.page = 1;
        this.loadSignatures();
        this.loadReports();
    }

    @Watch('report_pagination', {deep: true})
    onReportPaginationChanged(value) {
        this.loadReports();
    }

    mounted() {
        this.loadInitialData();
        this.loadSignatures();
        this.loadReports();
    }

    percentage(value) {
        return numeral(value).format('0%');
    }
    

     async loadSignatures() {
        try {
            let filter_versions = this.selected_versions;
            let filter_platforms = this.selected_platforms;
            let filter_products = this.selected_products;
            let data = await api.getSignatureList(
                this.facet_pagination.sortBy, 
                this.facet_pagination.descending, 
                { 
                    versions: filter_versions, 
                    platforms: filter_platforms, 
                    products: filter_products 
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
            let filter_versions = this.selected_versions;
            let filter_platforms = this.selected_platforms;
            let filter_products = this.selected_products;
            let data = await api.getReportList(
                this.report_pagination.sortBy, 
                this.report_pagination.descending, 
                { 
                    versions: filter_versions, 
                    platforms: filter_platforms, 
                    products: filter_products 
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