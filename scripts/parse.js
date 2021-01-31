const fs = require('fs');
const pathModule = require('path').posix;
const { repos, folderBlacklist, fileBlacklist, mocWhitelist } = require('./const');

console.time();

const inputFolder = pathModule.resolve(__dirname, './')
const outputFolder = pathModule.resolve(__dirname, './')

function normalize(repo) {
    return repo.toLowerCase().replace(/\//g, '');
}

const settingsJSONs = {};

let processed = 0;
let added = 0;
let jsons = 0;

function main() {
    for (const repo of repos) {
        console.log('>', repo)

        const inputFile = pathModule.resolve(inputFolder, normalize(repo) + '-tree.json')

        if (!fs.existsSync(inputFile)) {
            console.warn('Cannot find file', inputFile, ', skipping')
            continue
        }

        processed = 0;
        added = 0;
        jsons = 0;

        const json = require(inputFile);

        json.path = repo;

        processTree(json, '');

        const content = JSON.stringify({
            models: json,
            settings: Object.keys(settingsJSONs).length ? settingsJSONs : undefined,
        }, null, 2);

        const outputFile = pathModule.resolve(outputFolder, normalize(repo) + '.json')

        fs.writeFileSync(outputFile, content, 'utf8');
    }
}

function processTree(tree, fullPath) {
    const children = [];
    const files = [];

    if (folderBlacklist.includes(tree.path)) {
        return false;
    }

    fullPath = pathModule.join(fullPath, tree.path);

    for (const node of tree.tree) {
        processed++;

        if (typeof node === 'string') { // the node is a file (leaf)
            const isBlacklisted = folderBlacklist.some(folder => node.includes(folder))

            if (!isBlacklisted && processFile(node, tree.tree, fullPath)) {
                files.push(node);

                added++;
                process.stdout.write('\rProcessed: ' + processed + '  Added: ' + added + '  JSONs: ' + jsons);
            }
        } else { // the node is a tree
            if (processTree(node, fullPath)) {
                children.push(node);
            }
        }
    }

    // exclude empty folder
    if (!(children.length || files.length)) {
        return false
    }

    const { directFiles, subtrees } = groupByDir(files);

    tree.name = tree.path;
    tree.files = directFiles;
    tree.children = children.concat(subtrees);

    delete tree.path;
    delete tree.tree;

    // join the folder with subfolder if it's the only child
    if (tree.children.length === 1 && tree.files.length === 0) {
        // but don't do this to the root node!
        if (fullPath !== tree.name) {
            const thisName = tree.name

            Object.assign(tree, tree.children[0])

            tree.name = pathModule.join(thisName, tree.name)
        }
    }

    return true;
}

function processFile(file, siblings, fullPath) {
    if (file.endsWith('.moc') || file.endsWith('.moc3')) {
        if (mocWhitelist.includes(file)) {
            return false;
        }

        // path including the last "/"
        const dir = pathModule.dirname(file) + '/';

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

        const filePath = pathModule.join(fullPath, file);

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

    if (fileBlacklist.includes(fullPath + '/' + file)) {
        return false;
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
                const files1 = exactSiblings.map(path => path.slice(slashNextIndex));

                const { directFiles: _directFiles, subtrees: _subtrees } = groupByDir(files1);

                subtrees.push({
                    name: dir.slice(0, -1),
                    children: _subtrees.length ? _subtrees : undefined,
                    files: _directFiles.length ? _directFiles : undefined,
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

main();

process.stdout.write('\n\n');
console.timeEnd();
