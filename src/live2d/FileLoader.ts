import {
    Cubism2ModelSettings,
    Cubism4ModelSettings,
    InternalModel,
    Live2DFactory,
    Live2DFactoryContext,
    ModelSettings,
} from 'pixi-live2d-display';
import { CommonModelJSON } from '@/global';
import { isSettingsFileV2, isSettingsFileV3 } from '@/live2d/helpers';
import { url as urlUtils } from '@pixi/utils';

(Cubism2ModelSettings.prototype as any).replaceFiles = function(this: Cubism2ModelSettings, replace: (file: string, path: string) => string) {
    this.moc = replace(this.moc, 'moc');

    if (this.pose !== undefined) {
        (this.pose = replace(this.pose, 'pose'));
    }

    if (this.physics !== undefined) {
        (this.physics = replace(this.physics, 'physics'));
    }

    for (let i = 0; i < this.textures.length; i++) {
        this.textures[i] = replace(this.textures[i]!, `textures[${i}]`);
    }

    for (const [group, motions] of Object.entries(this.motions)) {
        for (let i = 0; i < motions.length; i++) {
            motions[i]!.file = replace(motions[i]!.file, `motions.${group}[${i}].file`);

            if (motions[i]!.sound !== undefined) {
                motions[i]!.sound = replace(motions[i]!.sound!, `motions.${group}[${i}].sound`);
            }
        }
    }

    if (this.expressions) {
        for (let i = 0; i < this.expressions.length; i++) {
            this.expressions[i]!.file = replace(this.expressions[i]!.file, `expressions[${i}]`);
        }
    }
};

(Cubism4ModelSettings.prototype as any).replaceFiles = function(this: Cubism4ModelSettings, replace: (file: string, path: string) => string) {
    this.moc = replace(this.moc, 'moc');

    if (this.pose !== undefined) {
        (this.pose = replace(this.pose, 'pose'));
    }

    if (this.physics !== undefined) {
        (this.physics = replace(this.physics, 'physics'));
    }

    for (let i = 0; i < this.textures.length; i++) {
        this.textures[i] = replace(this.textures[i]!, `textures[${i}]`);
    }

    if (this.motions) {
        for (const [group, motions] of Object.entries(this.motions)) {
            for (let i = 0; i < motions.length; i++) {
                motions[i]!.File = replace(motions[i]!.File, `motions.${group}[${i}].File`);

                if (motions[i]!.Sound !== undefined) {
                    motions[i]!.Sound = replace(motions[i]!.Sound!, `motions.${group}[${i}].Sound`);
                }
            }
        }
    }

    if (this.expressions) {
        for (let i = 0; i < this.expressions.length; i++) {
            this.expressions[i]!.File = replace(this.expressions[i]!.File, `expressions[${i}]`);
        }
    }
};

export function getFiles(settings: ModelSettings): string[] {
    const files: string[] = [];

    (settings as any).replaceFiles((file: string, path: string) => {
        files.push(file);

        return file;
    });

    return files;
}

declare global {
    interface File {
        webkitRelativePath: string;
    }
}

type Middleware<T> = (context: T, next: (err?: any) => Promise<void>) => Promise<void>

/**
 * Experimental loader to load resources from uploaded files.
 *
 * Though named as a "Loader", this class has nothing to do with `Live2DLoader`,
 * it only contains a middleware for the `Live2DFactory.`
 */
export class FileLoader {
    static filesMap: {
        [settingsFileURL: string]: {
            [resourceFileURL: string]: string
        }
    } = {};

    static resolveURL(settingsURL: string, fileURL: string): string {
        const resolved = FileLoader.filesMap[settingsURL]?.[fileURL];

        if (resolved === undefined) {
            throw new Error('Cannot find this file from uploaded files: ' + fileURL);
        }

        return resolved;
    }

    static factory: Middleware<Live2DFactoryContext> = async (context, next) => {
        if (Array.isArray(context.source) && context.source[0] instanceof File) {
            const settings = await FileLoader.upload(context.source);

            // override the default method to resolve URL from uploaded files
            settings.resolveURL = function(url) {
                return FileLoader.resolveURL(this.url, url);
            };

            context.source = settings;

            // clean up when destroying the model
            context.live2dModel.once('modelLoaded', (internalModel: InternalModel) => {
                internalModel.once('destroy', function(this: InternalModel) {
                    if (FileLoader.filesMap[this.settings.url]) {
                        for (const dataURL of Object.values(FileLoader.filesMap[this.settings.url])) {
                            URL.revokeObjectURL(dataURL);
                        }
                    }

                    delete FileLoader.filesMap[this.settings.url];
                });
            });
        }

        return next();
    };

    static validate(files: File[]) {

    }

    /**
     * Consumes the files by storing their data URLs, and builds a `ModelSettings` from these files.
     * @param files
     */
    static async upload(files: File[]): Promise<ModelSettings> {
        const settings = await FileLoader.createSettings(files);

        const settingsFilePath = (settings as any)._settingsActualPath;

        const definedFiles = getFiles(settings);

        const fileMap: Record<string, string> = {};

        // only consume the files defined in settings
        for (const definedFile of definedFiles) {
            const actualPath = urlUtils.resolve(settingsFilePath, definedFile);

            const actualFile = files.find(file => file.webkitRelativePath === actualPath);

            if (actualFile) {
                fileMap[definedFile] = URL.createObjectURL(actualFile);
            }
        }

        FileLoader.filesMap[settings.url] = fileMap;

        return settings;
    }

    /**
     * Builds a `ModelSettings` from given files. A settings file must be included in the files.
     */
    static async createSettings(files: File[]): Promise<ModelSettings> {
        const settingsFile = files.find(file => file.name.endsWith('.model.json') || file.name.endsWith('.model3.json'));

        if (!settingsFile) {
            throw new TypeError('Settings file not found');
        }

        const settingsText = await FileLoader.readText(settingsFile);
        const settingsJSON = JSON.parse(settingsText) as Partial<CommonModelJSON>;

        settingsJSON.url = URL.createObjectURL(settingsFile);

        let settings: Cubism2ModelSettings | Cubism4ModelSettings;

        if (isSettingsFileV2(settingsFile.name)) {
            if (!Cubism2ModelSettings.isValidJSON(settingsJSON)) {
                throw new Error('Invalid settings JSON v2');
            }

            settings = new Cubism2ModelSettings(settingsJSON);
        } else if (isSettingsFileV3(settingsFile.name)) {
            if (!Cubism4ModelSettings.isValidJSON(settingsJSON)) {
                throw new Error('Invalid settings JSON v3');
            }

            settings = new Cubism4ModelSettings(settingsJSON);
        } else {
            throw new Error('Unknown settings JSON');
        }

        const settingsActualPath = settingsFile.webkitRelativePath;

        const assertFileExists = (expectedFile: string) => {
            const actualPath = urlUtils.resolve(settingsActualPath, expectedFile);

            if (!files.find(file => file.webkitRelativePath === actualPath)) {
                throw new Error(`File "${expectedFile}" is defined in settings, but does not exist in uploaded files`);
            }
        };

        assertFileExists(settings.moc);

        settings.textures.forEach(assertFileExists);

        (settings as any)._settingsActualPath = settingsActualPath;

        return settings;
    }

    static async readText(file: File): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file, 'utf8');
        });
    }
}

Live2DFactory.live2DModelMiddlewares.unshift(FileLoader.factory);
