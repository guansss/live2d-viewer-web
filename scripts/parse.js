const fs = require('fs');
const pathModule = require('path');
const pathModulePosix = pathModule.posix;
const { repos, folderBlacklist, fileBlacklist, mocWhitelist } = require('./const');

console.time();

const inputFolder = pathModule.resolve(__dirname, './');
const outputFolder = pathModule.resolve(__dirname, '../public');

function normalize(repo) {
    return repo.toLowerCase().replace(/\//g, '');
}

let processed = 0;
let added = 0;
let jsons = 0;
let settingsJSONs = {};

function main() {
    for (const repo of repos) {
        console.log('\n>', repo);

        const inputFile = pathModule.resolve(inputFolder, normalize(repo) + '-tree.json');

        if (!fs.existsSync(inputFile)) {
            console.warn('Cannot find file', inputFile, ', skipping');
            continue;
        }

        processed = 0;
        added = 0;
        jsons = 0;
        settingsJSONs = {};

        const json = require(inputFile);

        json.path = repo;

        processTree(json, '');
        joinDirs(json);

        // strip empty arrays
        traverse(json, node => {
            if (!node.files.length) {
                delete node.files;
            }
            if (!node.children.length) {
                delete node.children;
            }
        });

        const content = JSON.stringify({
            models: json,
            settings: Object.keys(settingsJSONs).length ? settingsJSONs : undefined,
        }, null, 2);

        const outputFile = pathModule.resolve(outputFolder, normalize(repo) + '.json');

        fs.writeFileSync(outputFile, content, 'utf8');
    }
}

function processTree(tree, fullPath) {
    const children = [];
    const files = [];

    fullPath = pathModulePosix.join(fullPath, tree.path);

    if (folderBlacklist.includes(fullPath)) {
        return false;
    }

    for (const node of tree.tree) {
        processed++;

        // when the node is a leaf (file)
        if (typeof node === 'string') {
            if (processFile(node, tree.tree, fullPath)) {
                files.push(node);

                added++;
                process.stdout.write('\rProcessed: ' + processed + '  Added: ' + added + '  JSONs: ' + jsons);
            }
        }
        // when the node is a tree
        else {
            if (processTree(node, fullPath)) {
                children.push(node);
            }
        }
    }

    // exclude empty folder
    if (!(children.length || files.length)) {
        return false;
    }

    const { directFiles, subtrees } = groupByDir(files);

    tree.name = tree.path;
    tree.files = directFiles;
    tree.children = children.concat(subtrees);

    delete tree.path;
    delete tree.tree;

    return true;
}

function processFile(file, siblings, fullPath) {
    const filePath = pathModulePosix.join(fullPath, file);

    if (fileBlacklist.includes(filePath) || folderBlacklist.some(folder => filePath.startsWith(folder))) {
        return false;
    }

    if (file.endsWith('.moc') || file.endsWith('.moc3')) {
        if (mocWhitelist.includes(file)) {
            return false;
        }

        // path including the last "/"
        const dir = pathModulePosix.dirname(file) + '/';

        const exactSiblings = siblings.filter(f => f.startsWith(dir)).map(f => f.slice(dir.length));

        for (const s of exactSiblings) {
            if (s.endsWith('model.json') || s.endsWith('model3.json')) {
                return false;
            }
        }

        const textures = exactSiblings.filter(f => f.endsWith('.png'));

        if (!textures.length) {
            process.stdout.write('\nMissing textures ' + file + '\n');
            return false;
        }

        const motions = exactSiblings.filter(f => f.endsWith('.mtn') || f.endsWith('.motion3.json'));
        const physics = exactSiblings.find(f => f.includes('physics'));
        const pose = exactSiblings.find(f => f.includes('pose'));

        const filePath = pathModulePosix.join(fullPath, file);

        settingsJSONs[filePath] = file.endsWith('.moc')
            ? {
                textures, pose, physics,
                motions: motions.length ? { '': motions } : undefined,
            }
            : {
                FileReferences: {
                    Textures: textures,
                    Physics: physics,
                    Pose: pose,
                    Motions: motions.length ? { '': motions } : undefined,
                },
            };

        jsons++;

        return true;
    }

    return file.endsWith('model.json') || file.endsWith('model3.json') || file.endsWith('.zip');
}

function groupByDir(files) {
    const directFiles = [];
    const subtrees = [];

    for (let i = 0; i < files.length; i++) {
        const path = files[i];
        const slashNextIndex = path.indexOf('/') + 1;

        if (slashNextIndex > 0) {
            const dir = path.slice(0, slashNextIndex);
            const exactSiblings = files.filter(path => path.startsWith(dir));

            if (exactSiblings.length > 1) {
                const subfiles = exactSiblings.map(path => path.slice(slashNextIndex));

                const { directFiles: _directFiles, subtrees: _subtrees } = groupByDir(subfiles);

                subtrees.push({
                    name: dir.slice(0, -1),
                    children: _subtrees,
                    files: _directFiles,
                });

                i += exactSiblings.length - 1;
            } else {
                directFiles.push(path);
            }
        } else {
            directFiles.push(path);
        }
    }

    return { directFiles, subtrees };
}

function joinDirs(node, isNotRoot = false) {
    // join the dir with subdir if it's the only child
    if (
        isNotRoot
        && (node.children && node.children.length === 1)
        && (!node.files || node.files.length === 0)
    ) {
        const thisName = node.name;

        Object.assign(node, node.children[0]);

        node.name = pathModulePosix.join(thisName, node.name);

        // do it again since this node has been overwritten
        joinDirs(node, true);
    } else {
        if (node.children) {
            for (const child of node.children) {
                joinDirs(child, true);
            }
        }
    }
}

function traverse(node, fn) {
    fn(node);

    if (node.children) {
        for (const child of node.children) {
            traverse(child, fn);
        }
    }
}

main();

process.stdout.write('\n\n');
console.timeEnd();
