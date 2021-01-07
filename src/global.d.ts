import { Cubism2Spec, CubismSpec } from 'pixi-live2d-display';

export type CommonModelJSON = (CubismSpec.ModelJSON | Cubism2Spec.ModelJSON) & { url?: string }

declare global {
    interface File {
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory
        webkitRelativePath: string;
    }
}
