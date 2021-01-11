import { Live2DApp } from '@/app/Live2DApp';

declare module '*.vue' {
    import Vue from 'vue';
    export default Vue;
}

declare module 'vue/types/vue' {
    export interface Vue {
        $live2dApp: Live2DApp;
    }
}
