import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { api } from '../../api';

@Component({
    template: require('./apps.html')
})
export class Apps extends Vue {

    products = [];

    mounted() {
        this.loadInitialData();
    }

    async loadInitialData() {
        this.products = await api.getProducts();
    }
}