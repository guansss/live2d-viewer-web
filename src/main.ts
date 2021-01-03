import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { Live2DApp } from '@/live2d/Live2DApp';
import { config } from 'pixi-live2d-display';

const live2dApp = new Live2DApp(document.getElementById('canvas') as HTMLCanvasElement);

Vue.prototype.$live2dApp = live2dApp;

Vue.config.productionTip = false;

Vue.directive('visible', function(el, binding) {
    el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});

(window as any).app = new Vue({
    vuetify,
    render: h => h(App),
}).$mount('#app');

(window as any).config = config;
