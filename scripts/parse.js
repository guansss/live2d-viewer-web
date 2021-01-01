const fs = require('fs');

console.time();

const repos = [
    'Eikanya/Live2d-model',
    // 'xiaoski/live2d_models_collection',
];

function normalize(repo) {
    return repo.toLowerCase().replace(/\//g, '');
}

const mocWhitelist = [
    "Sacred Sword princesses/boss_cg_live2d_h004/res/iderhelamodel.moc",
    "Sacred Sword princesses/char_cg_live2d_007/res/dorlamodel.moc",
    "Sacred Sword princesses/char_cg_live2d_049/res/airmanirmodel.moc",
    "Sacred Sword princesses/char_cg_live2d_h048/res/ainir.moc",
];

const modelBlacklist = [
    "Sacred Sword princesses/model.json",
];

const settingsJSONs = {};

let processed = 0;
let added = 0;
let jsons = 0;

function main() {
    for (const repo of repos) {
        const json = require('./' + normalize(repo) + '-tree.json');

        json.path = repo;

        processTree(json);

        const content = JSON.stringify({
            models: json,
            settings: settingsJSONs,
        }, null, 2);

        fs.writeFileSync(normalize(repo) + '.json', content, 'utf8');
    }
}

function processTree(tree) {
    const children = [];
    const files = [];

    for (const node of tree.tree) {
        processed++;

        if (typeof node === 'string') {
            if (processFile(node, tree.tree)) {
                files.push(node);

                added++;
                process.stdout.write('\rProcessed: ' + processed + '  Added: ' + added + '  JSONs: ' + jsons);
            }
        } else {
            processTree(node);
            children.push(node);
        }
    }

    const { directFiles, subTrees } = groupByDir(files, 0);

    tree.name = tree.path;
    tree.files = directFiles;
    tree.children = children.concat(subTrees);

    delete tree.path;
    delete tree.tree;
}

function processFile(file, siblings) {
    if (file.endsWith('.moc') || file.endsWith('.moc3')) {
        if (mocWhitelist.includes(file)) {
            return false;
        }

        // path including the last "/"
        const dir = dirname(file, 1);

        const exactSiblings = siblings.filter(f => f.startsWith(dir)).map(f => f.slice(dir.length));

        for (const s of exactSiblings) {
            if (s.endsWith('model.json') || s.endsWith('model3.json')) {
                return false;
            }
        }

        const motions = exactSiblings.filter(f => f.endsWith('.mtn') || f.endsWith('.motion3.json'));
        const textures = exactSiblings.filter(f => f.endsWith('.png'));
        const physics = exactSiblings.find(f => f.includes('physics'));
        const pose = exactSiblings.find(f => f.includes('pose'));

        if (!textures.length) {
            process.stdout.write('\nMissing textures ' + file + '\n');
            return false;
        }

        settingsJSONs[file] = file.endsWith('.moc')
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

    return (file.endsWith('model.json') || file.endsWith('model3.json')) && !modelBlacklist.includes(file);
}

function groupByDir(files, depth) {
    const directFiles = [];
    const subTrees = [];

    for (let i = 0; i < files.length; i++) {
        const path = files[i];
        const slashNextIndex = path.indexOf('/') + 1;

        if (slashNextIndex > 0) {
            const dir = path.slice(0, slashNextIndex);
            const exactSiblings = files.filter(path => path.startsWith(dir));

            if (exactSiblings.length > 1) {
                const files1 = exactSiblings.map(path => path.slice(slashNextIndex));

                const { directFiles: _directFiles, subTrees: _subTrees } = groupByDir(files1, depth + 1);

                subTrees.push({
                    name: dir.slice(0, -1),
                    children: _subTrees.length ? _subTrees : undefined,
                    files: _directFiles.length ? _directFiles : undefined,
                });

                i += exactSiblings.length - 1;
            } else {
                directFiles.push(path);
            }
        }
    }

    return { directFiles, subTrees };
}

function dirname(path, offset = 0) {
    const index = path.lastIndexOf('/');

    return index > -1 ? path.slice(0, index + offset) : path;
}

main();

console.timeEnd();
