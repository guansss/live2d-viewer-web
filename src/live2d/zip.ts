import {
    Cubism2ModelSettings,
    Cubism4ModelSettings,
    Live2DFactory,
    Live2DFactoryContext,
    Middleware,
    ModelSettings,
} from 'pixi-live2d-display';
import JSZip from 'jszip';
import { isSettingsFile, isSettingsFileV2, isSettingsFileV3 } from '@/live2d/helpers';
import { CommonModelJSON } from '@/global';
import { url as urlUtils } from '@pixi/utils';
import { getFiles } from '@/live2d/FileLoader';

class ZipLoader {
    static factory: Middleware<Live2DFactoryContext> = async (context, next) => {
        const source = context.source;

        let zipBlob: Blob | undefined;

        if (typeof source === 'string' && source.endsWith('.zip')) {
            zipBlob = await fetch(source).then(res => res.blob());
        } else if (
            Array.isArray(source)
            && source.length === 1
            && source[0] instanceof File
            && source[0].name.endsWith('.zip')
        ) {
            zipBlob = source[0];
        }

        if (zipBlob) {
            if (!zipBlob.size) {
                throw new Error('Empty zip file');
            }

            const jszip = await JSZip.loadAsync(zipBlob);

            const files = await ZipLoader.unzip(jszip);

            // pass files to the FileLoader
            context.source = files;
        }

        return next();
    };

    static async unzip(jsZip: JSZip): Promise<File[]> {
        const paths: string[] = [];

        jsZip.forEach(relativePath => paths.push(relativePath));

        const settingsFile = paths.find(path => isSettingsFile(path));

        if (!settingsFile) {
            throw  new Error('Settings file not found');
        }

        const settings = await ZipLoader.createSettingsWithFile(jsZip, settingsFile);

        const definedFiles = getFiles(settings);
        const requiredFilePaths: string[] = [];

        // only consume the files defined in settings
        for (const definedFile of definedFiles) {
            const actualPath = urlUtils.resolve(settingsFile, definedFile);

            if (paths.includes(actualPath)) {
                requiredFilePaths.push(actualPath);
            }
        }

        // FIXME: don't do this
        requiredFilePaths.push(settingsFile);

        return Promise.all(requiredFilePaths.map(
            async path => {
                const fileName = path.slice(path.lastIndexOf('/') + 1);

                const blob = await jsZip.file(path)!.async('blob');

                const file = new File([blob], fileName);

                // let's borrow this property...
                Object.defineProperty(file, 'webkitRelativePath', {
                    value: path,
                });

                return file;
            },
        ));
    }

    static async createSettingsWithFile(jsZip: JSZip, settingsFile: string): Promise<ModelSettings> {
        const settingsText = await jsZip.file(settingsFile)?.async('text');

        if (!settingsText) {
            throw new Error('Cannot find settings file: ' + settingsFile);
        }

        const settingsJSON = JSON.parse(settingsText) as Partial<CommonModelJSON>;

        // url must be a string, even if empty
        settingsJSON.url = '';

        let settings: Cubism2ModelSettings | Cubism4ModelSettings;

        if (isSettingsFileV2(settingsFile)) {
            if (!Cubism2ModelSettings.isValidJSON(settingsJSON)) {
                throw new Error('Invalid settings JSON v2');
            }

            settings = new Cubism2ModelSettings(settingsJSON);
        } else if (isSettingsFileV3(settingsFile)) {
            if (!Cubism4ModelSettings.isValidJSON(settingsJSON)) {
                throw new Error('Invalid settings JSON v3');
            }

            settings = new Cubism4ModelSettings(settingsJSON);
        } else {
            throw new Error('Unknown settings JSON');
        }

        const assertFileExists = (expectedFile: string) => {
            const actualPath = urlUtils.resolve(settingsFile, expectedFile);

            if (!jsZip.file(actualPath)) {
                throw new Error(`File "${expectedFile}" is defined in settings, but does not exist in the zip`);
            }
        };

        assertFileExists(settings.moc);

        settings.textures.forEach(assertFileExists);

        (settings as any)._settingsActualPath = settingsFile;

        return settings;
    }
}

Live2DFactory.live2DModelMiddlewares.unshift(ZipLoader.factory);
