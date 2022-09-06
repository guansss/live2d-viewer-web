declare module '*.vue' {
    import Vue from 'vue';
    export default Vue;
}

declare module 'vue/types/vue' {
    export interface Vue {
        $live2dApp: import('@/app/Live2DApp').Live2DApp;
    }
}
