import { basename } from '@/utils/file';
import { Cubism2ModelSettings, Cubism4ModelSettings, FileLoader, ModelSettings } from 'pixi-live2d-display';
import { isMocFile, isMocFileV2, isSettingsFile } from './helpers';

const MAX_SETTINGS_FILES = 5;

let uid = 0;

const defaultCreateSettings = FileLoader.createSettings;

FileLoader.createSettings = async (files: File[]) => {
    if (!files.find(file => isSettingsFile(file.name))) {
        return createFakeSettings(files);
    }

    return defaultCreateSettings(files);
};

export async function uploadFiles(files: File[]): Promise<ModelSettings[]> {
    if (files.length === 1 && files[0].name.endsWith('.zip')) {
        // just let it go...
        return [];
    }

    if (files.some(file => isSettingsFile(file.name))) {
        return createSettings(files);
    } else {
        return [createFakeSettings(files)];
    }
}

export async function createSettings(files: File[]): Promise<ModelSettings[]> {
    const settingsFiles: File[] = [];
    const nonSettingsFiles: File[] = [];

    for (const file of files) {
        if (isSettingsFile(file.name)) {
            settingsFiles.push(file);
        } else {
            nonSettingsFiles.push(file);
        }
    }

    if (settingsFiles.length > MAX_SETTINGS_FILES) {
        console.warn(`Too many settings files (${settingsFiles.length}/${MAX_SETTINGS_FILES})`);

        settingsFiles.length = MAX_SETTINGS_FILES;
    }

    let error: unknown;

    const settingsArray: ModelSettings[] = [];

    await Promise.all(settingsFiles.map(
        async settingsFile => {
            try {
                const partialFiles = [settingsFile, ...nonSettingsFiles];

                const settings = await FileLoader.createSettings(partialFiles);

                settings.validateFiles(partialFiles.map(file => file.webkitRelativePath));

                settingsArray.push(settings);
            } catch (e) {
                // just care about the first error
                error = error || e;

                console.warn(e);
            }
        },
    ));

    // it's OK when there's at least one valid settings file
    if (!settingsArray.length) {
        throw error;
    }

    return settingsArray;
}

function createFakeSettings(files: File[]): ModelSettings {
    const mocFiles = files.filter(file => isMocFile(file.name));

    if (mocFiles.length !== 1) {
        const fileList = mocFiles.length ? `(${mocFiles.map(f => `"${f}"`).join(',')})` : '';

        throw new Error(`Expected exactly one moc file, got ${mocFiles.length} ${fileList}`);
    }

    const mocFile = mocFiles[0].webkitRelativePath;
    const modelName = basename(mocFile).replace(/\.moc3?/, '');

    const filePaths = files.map(file => file.webkitRelativePath);

    const textures = filePaths.filter(f => f.endsWith('.png'));

    if (!textures.length) {
        throw new Error('Textures not found');
    }

    const motions = filePaths.filter(f => f.endsWith('.mtn') || f.endsWith('.motion3.json'));
    const physics = filePaths.find(f => f.includes('physics'));
    const pose = filePaths.find(f => f.includes('pose'));

    let settings: ModelSettings;

    if (isMocFileV2(mocFile)) {
        settings = new Cubism2ModelSettings({
            url: modelName + '.model.json',
            textures, pose, physics,
            model: mocFile,
            motions: motions.length
                ? {
                    '': motions.map(motion => ({ file: motion })),
                }
                : undefined,
        });
    } else {
        settings = new Cubism4ModelSettings({
            url: modelName + '.model3.json',
            Version: 3,
            FileReferences: {
                Moc: mocFile,
                Textures: textures,
                Physics: physics,
                Pose: pose,
                Motions: motions.length
                    ? {
                        '': motions.map(motion => ({ File: motion })),
                    }
                    : undefined,
            },
        });
    }

    settings.name = modelName;

    // provide this property for FileLoader
    (settings as any)._objectURL = 'DontTouchMe://' + settings.url;

    return settings;
}
