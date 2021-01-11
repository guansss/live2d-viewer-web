import { ZipLoader } from 'pixi-live2d-display';
import JSZip from 'jszip';

ZipLoader.zipReader = (data: Blob, url: string) => JSZip.loadAsync(data);

ZipLoader.readText = (jsZip: JSZip, path: string) => {
    const file = jsZip.file(path);

    if (!file) {
        throw new Error('Cannot find file: ' + path);
    }

    return file.async('text');
};

ZipLoader.getFilePaths = (jsZip: JSZip) => {
    const paths: string[] = [];

    jsZip.forEach(relativePath => paths.push(relativePath));

    return Promise.resolve(paths);
};

ZipLoader.getFiles = (jsZip: JSZip, paths: string[]) =>
    Promise.all(paths.map(
        async path => {
            const fileName = path.slice(path.lastIndexOf('/') + 1);

            const blob = await jsZip.file(path)!.async('blob');

            return new File([blob], fileName);
        }));
