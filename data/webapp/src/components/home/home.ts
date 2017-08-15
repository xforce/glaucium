import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import moment from 'moment';
import * as billboard from 'billboard.js';
import * as ResizeSensor from 'element-resize-detector';
import { api, RecentReportResult } from '../../api';


@Component({
    template: require('./home.html')
})
export class Home extends Vue {
    inverted: boolean = true; // default value
    message: string = 'Meow';
    loaded_report_count: number = 0;
    total_report_count: number = 0;
    recent_reports_items: Array<Object> = [];
    charts = [];
    recent_reports_headers = [
        { text: 'Crash ID', value: 'crash_id', align: 'left', sortable: false },
        { text: 'Date', value: 'date', desc: true, sortable: false },
        { text: 'Signature', value: 'signature', sortable: false },
        { text: 'Product', value: 'product', sortable: false },
        { text: 'Version', value: 'version', sortable: false },
        { text: 'Platform', value: 'platform', sortable: false },
    ];
    recent_reports_pagination = {
        descending: true,
        sortBy: null,
        page: 1,
        rowsPerPage: 25
    };

    object: { default: string } = { default: 'Default object property!' }; // objects as default values don't need to be wrapped into functions

    @Watch('$route.path')
    pathChanged() {
        console.log('Meow');
    }

    @Watch('sidebarState')
    onSidebarStateChanged(val: boolean, oldVal: boolean) {
    }

    get sidebarState () {
        return this.$store.state.sidebar;
    }

    async loadRecentChart(days: Number, bindto: string) {
        // TODO(alexander): Filter out empty versions
        // No need to show them in the chart
        try {
            let data = await api.getDayHistogramData(days);
            let groups = ['x'];
            for (let date of data.dates) {
                 groups.push(date);
            }
            let chart_data = {
                'data': {
                    'columns': [groups],
                    'type': 'area-spline',
                    x: 'x'
                },
                axis: {
                    x: {
                        type: 'timeseries',
                        tick: {
                            format: function (x) { return moment(x).format('MMM Do'); }
                        },
                        padding: {
                            left: 1000 * 60 * 60 * data.dates.length,
                            right: 1000 * 60 * 60 * data.dates.length
                        }
                    },
                },
                'bindto': bindto
            };
            for (let version of data.datasets) {
                let columns = [version.label];
                let total_amount: number = 0;
                for (let amount_per_day of version.data) {
                    columns.push(amount_per_day);
                    total_amount += amount_per_day;
                }
                if (total_amount > 0) {
                    chart_data.data.columns.push(columns);
                }
            }
            let day_chart = billboard.bb.generate(chart_data);
            day_chart.resize();
            this.charts.push(day_chart);
        } catch (e) {
            console.log(e);
        }
    }

    async mounted() {
        this.loadInitialData();
    }

    async loadInitialData() {
        let m = ResizeSensor({
            strategy: 'scroll'
        });
        m.listenTo(document.getElementById('home_column'), () => {
            window.dispatchEvent(new Event('resize'));
        });
        const { sortBy, descending, page, rowsPerPage } = this.recent_reports_pagination;
        try {
            let data = await api.getRecentReports(sortBy, descending);
            this.recent_reports_items = data.items;
            this.loaded_report_count = data.loadedReportCount;
            this.total_report_count = data.totalReportCount;
        } catch (e) {
            console.log(e);
        }
        // Prevent most of the UI hickups as we don't potentially then load all 3 graphs in one frame :D
        await this.loadRecentChart(1, '#crash-stat-chart-1days');
        await this.loadRecentChart(7, '#crash-stat-chart-7days');
        await this.loadRecentChart(14, '#crash-stat-chart-14days');
    }

    resize() {
        window.dispatchEvent(new Event('resize'));
        for (let chart of this.charts) {
            chart.flush();
        }
    }
}
