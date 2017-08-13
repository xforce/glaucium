import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';

@Component({
    template: require('./login.html')
})
export class Login extends Vue {

    inverted: boolean = true; // default value

    object: { default: string } = { default: 'Default object property!' }; // objects as default values don't need to be wrapped into functions

    @Watch('$route.path')
    pathChanged() {
    }

    mounted() {
        
    }
}
