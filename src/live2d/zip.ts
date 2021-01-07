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
        if (typeof context.source === 'string' && context.source.endsWith('.zip')) {
            const url = context.source;

            const blob = await fetch(url).then(res => res.blob());

            if (!blob.size) {
                throw new Error('Empty response');
            }

            const jszip = await JSZip.loadAsync(blob);

            const files = await ZipLoader.unzip(jszip);

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
