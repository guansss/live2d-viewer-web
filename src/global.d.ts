import { Cubism2Spec, CubismSpec } from 'pixi-live2d-display';

export type CommonModelJSON = (CubismSpec.ModelJSON | Cubism2Spec.ModelJSON) & { url?: string }

declare global {
    const __BUILD_TIME__: number;

    interface File {
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory
        webkitRelativePath: string;
    }

    function setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
}
