import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import'./stylus/app.styl';

import { Login } from './components/login';
import { Home } from './components/home';
import { Reports } from './components/reports';
import { Signature } from './components/signature';
import { Search } from './components/search';
import { Report } from './components/report';
import { Apps } from './components/apps';


Vue.use(Vuetify);
Vue.use(VueRouter);
Vue.use(Vuex);

let router = new VueRouter({
  routes: [
    {path: '/login', component: Login},
    {path: '/apps', component: Apps},
    {path: '/search', component: Search},
    {path: '/reports', component: Reports},
    {path: '/report/:id', component: Report, props: true},
    {path: '/signature/:sig', component: Signature, props: true},
    {path: '/', component: Home}
  ]
});

const store = new Vuex.Store({
  state: {
    sidebar_mini: false,
    sidebar: true,
  },
  mutations: {
    'glaucium/SIDEBAR_MINI' (state, payload) {
        state.sidebar_mini = payload;
    },
    'glaucium/SIDEBAR' (state, payload) {
        state.sidebar = payload;
    },
  }
});

new Vue({
  el: '#app',
  computed: {
      nav_active: {
        get () {
          return this.$store.state.sidebar;
        },
        set (val) {
          this.$store.commit('glaucium/SIDEBAR', val);
        }
      },
      nav_mini: {
        get () {
          return this.$store.state.sidebar_mini;
        },
        set (val) {
          this.$store.commit('glaucium/SIDEBAR_MINI', val);
        }
      },
   },
   data () {
      return {
        items: [ ]
      };
    },
  router: router,
  store,
});