import Vue from 'vue';
import VueApp from './App.vue';
import vuetify from './plugins/vuetify';
import { config } from 'pixi-live2d-display';
import { App } from '@/app/App';

Vue.config.productionTip = false;

Vue.directive('visible', function(el, binding) {
    el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});

(window as any).vueApp = new (Vue as any)({
    vuetify,
    render: (h: any) => h(VueApp),
}).$mount('#app');

(window as any).App = App;
(window as any).config = config;

config.logLevel = config.LOG_LEVEL_VERBOSE;
