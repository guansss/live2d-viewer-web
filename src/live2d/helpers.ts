export function isSettingsFileV2(file: string) {
    return file.endsWith('model.json');
}

export function isSettingsFileV3(file: string) {
    return file.endsWith('model3.json');
}

export function isSettingsFile(file: string) {
    return isSettingsFileV2(file) || isSettingsFileV3(file);
}

export function isMocFileV2(file: string) {
    return file.endsWith('.moc');
}

export function isMocFileV3(file: string) {
    return file.endsWith('.moc3');
}

export function isMocFile(file: string) {
    return isMocFileV2(file) || isMocFileV3(file);
}
