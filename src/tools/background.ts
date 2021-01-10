import { readAsBase64 } from '@/utils/file';
import { EventEmitter } from '@pixi/utils';

const BG_STORAGE_KEY = '_bg';

export namespace Background {
    let currentObjectURL = '';

    let styleElement: HTMLStyleElement | undefined;

    export const emitter = new EventEmitter();

    export let current: string = '';

    export async function set(file: File) {
        const objectURL = URL.createObjectURL(file);

        document.body.style.backgroundImage = `url(${objectURL})`;

        current = file.name;

        emitter.emit('change', current);

        currentObjectURL = objectURL;

        const base64 = await readAsBase64(file);

        if (currentObjectURL === objectURL) {
            localStorage.setItem(BG_STORAGE_KEY, base64);
        }

        URL.revokeObjectURL(objectURL);
    }

    export function reset() {
        current = '';
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = '#222222';
        localStorage.removeItem(BG_STORAGE_KEY);

        if (styleElement) {
            document.head.removeChild(styleElement);
            styleElement = undefined;
        }

        emitter.emit('change', current);
    }

    function loadBackground() {
        styleElement = document.createElement('style');

        const dataURL = localStorage.getItem('_bg');

        if (dataURL) {
            styleElement.innerText = `body {background-image: url(${dataURL});}`;

            current = '(local file)';
        } else {
            styleElement.innerText = `body {background-color: #222222;}`;
        }

        document.head.appendChild(styleElement);
        document.body.style.backgroundSize = 'cover';
    }

    loadBackground();
}
