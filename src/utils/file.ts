import { nonNullableFilter } from './arr';

export function basename(path: string): string {
    // https://stackoverflow.com/a/15270931
    return path.split(/[\\/]/).pop()!;
}

/**
 * Checks if it's files being dragged at this drag event.
 *
 * @see https://stackoverflow.com/q/5323668/13237325
 */
export function isDraggingFile(event: DragEvent): boolean {
    return !!event.dataTransfer?.types.some((type) => type === 'Files');
}

export async function readFiles(dataTransferItemList: DataTransferItemList): Promise<File[]> {
    const entries = [...dataTransferItemList].map((item) => item.webkitGetAsEntry()).filter(nonNullableFilter);

    return readEntries(entries);
}

async function readEntries(entries: FileSystemEntry[]): Promise<File[]> {
    const files: File[] = [];

    await Promise.all(
        entries.map(async (entry) => {
            if (entry.isFile) {
                files.push(await readFileEntry(entry as FileSystemFileEntry));
            } else if (entry.isDirectory) {
                const subEntries = await readDirEntry(entry as FileSystemDirectoryEntry);

                files.push(...(await readEntries(subEntries)));
            }
        })
    );

    return files;
}

function readDirEntry(dirEntry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
    return new Promise((resolve, reject) => {
        dirEntry.createReader().readEntries(resolve, reject);
    });
}

async function readFileEntry(fileEntry: FileSystemFileEntry): Promise<File> {
    const file = await new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject));

    let relativePath = fileEntry.fullPath;

    // relative path should just be relative...
    if (relativePath.startsWith('/')) {
        relativePath = relativePath.slice(1);
    }

    // let's borrow this property...
    Object.defineProperty(file, 'webkitRelativePath', {
        value: relativePath,
    });

    return file;
}

export function readAsBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
