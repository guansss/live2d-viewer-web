import {
    Cubism2ModelSettings,
    Cubism2Spec,
    Cubism4ModelSettings,
    CubismSpec,
    ModelSettings,
} from 'pixi-live2d-display';
import { isMocFile, isMocFileV2, isSettingsFile } from '@/live2d/helpers';
import { FileLoader } from '@/live2d/FileLoader';

const MAX_SETTINGS_FILES = 5;

let uid = 0;

const defaultCreateSettings = FileLoader.createSettings;

FileLoader.createSettings = async (files) => {
    if (!files.find(file => isSettingsFile(file.name))) {
        return createSettingsFromFiles(files);
    }

    return defaultCreateSettings(files);
};

export async function validateUploadedFiles(files: File[]): Promise<File[]> {
    const fileGroups = splitFilesBySettingsFile(files);

    if (fileGroups.length) {
        const filesSet = new Set<File>();

        let error: Error | undefined;

        await Promise.allSettled(fileGroups.map(
            async fileGroup => {
                try {
                    // will throw an error if it fails
                    await FileLoader.createSettings(fileGroup);

                    // append the valid settings file, along with all the non-settings files
                    fileGroup.forEach(file => filesSet.add(file));
                } catch (e) {
                    // just care about the first error
                    error = error || e;
                }
            },
        ));

        // it's OK when there's at least one valid settings file
        if (!filesSet.size) {
            // here the error will always be defined, but, just in case
            error = error || new Error('Unknown error');

            throw error;
        }

        return [...filesSet];
    } else if (files.length === 1 && files[0].name.endsWith('.zip')) {
        // just let it go...
        return files;
    } else {
        // will throw an error if it fails
        createSettingsFromFiles(files);

        return files;
    }
}

export function splitFilesBySettingsFile(files: File[]): File[][] {
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
        throw new Error(`Too many settings files ${settingsFiles.length}/${MAX_SETTINGS_FILES}`);
    }

    return settingsFiles.map(settingsFile => [settingsFile, ...nonSettingsFiles]);
}

function createSettingsFromFiles(files: File[]): ModelSettings {
    const mocFiles = files.filter(file => isMocFile(file.name));

    if (mocFiles.length !== 1) {
        const fileList = mocFiles.length ? `(${mocFiles.map(f => `"${f}"`).join(',')})` : '';

        throw new Error(`Expected exactly one moc file, got ${mocFiles.length} ${fileList}`);
    }

    const mocFile = mocFiles[0].webkitRelativePath;

    const filePaths = files.map(file => file.webkitRelativePath);

    const textures = filePaths.filter(f => f.endsWith('.png'));

    if (!textures.length) {
        throw new Error('Textures not found');
    }

    const motions = filePaths.filter(f => f.endsWith('.mtn') || f.endsWith('.motion3.json'));
    const physics = filePaths.find(f => f.includes('physics'));
    const pose = filePaths.find(f => f.includes('pose'));

    let fakeLocalPath = 'dummy' + (uid++);
    let settings: ModelSettings;

    if (isMocFileV2(mocFile)) {
        fakeLocalPath += '.model.json';

        settings = new Cubism2ModelSettings({
            url: 'DontLoadMe://' + fakeLocalPath,
            textures, pose, physics,
            model: mocFile,
            motions: motions.length
                ? {
                    '': motions.map(motion => ({ file: motion })),
                }
                : undefined,
        } as Cubism2Spec.ModelJSON);
    } else {
        fakeLocalPath += '.model3.json';

        settings = new Cubism4ModelSettings({
            url: 'DontLoadMe://' + fakeLocalPath,
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
        } as CubismSpec.ModelJSON);
    }

    (settings as any)._settingsActualPath = fakeLocalPath;

    return settings;
}
