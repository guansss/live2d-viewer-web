const fs = require('fs');
const path = require('path');

// https://api.github.com/repos/Eikanya/Live2d-model/git/trees/master?recursive=true

const json = JSON.parse(fs.readFileSync('master.json').toString('utf-8'));

let models = json.tree.map(item => item.path);

// const content1 = models.map(file => `"${file}",\n`).join('').slice(0, -2);
// fs.writeFileSync('files.json', `[${content1}]`, 'utf8');

const rawLength = models.length;

const settingsJSONs = {};

const mocWhitelist = [
    "Sacred Sword princesses/boss_cg_live2d_h004/res/iderhelamodel.moc",
    "Sacred Sword princesses/char_cg_live2d_007/res/dorlamodel.moc",
    "Sacred Sword princesses/char_cg_live2d_049/res/airmanirmodel.moc",
    "Sacred Sword princesses/char_cg_live2d_h048/res/ainir.moc",
];

const modelBlacklist = [
    "Sacred Sword princesses/model.json",
];

models = models.filter((file, i) => {
    if (file.endsWith('.moc') || file.endsWith('.moc3')) {
        if (mocWhitelist.includes(file)) {
            return false;
        }

        const dir = path.dirname(file) + '/';

        const siblings = models.filter(f => f.startsWith(dir)).map(f => f.slice(dir.length));

        if (siblings.some(f => f.endsWith('model.json') || f.endsWith('model3.json'))) {
            return false;
        }

        const motions = siblings.filter(f => f.endsWith('.mtn') || f.endsWith('.motion3.json'));
        const textures = siblings.filter(f => f.endsWith('.png'));
        const physics = siblings.find(f => f.includes('physics'));
        const pose = siblings.find(f => f.includes('pose'));

        if (!textures.length) {
            console.log('Missing textures', file);
            return false;
        }

        settingsJSONs[file] = file.endsWith('.moc') ? {
            textures, pose, physics,
            motions: motions.length ? {'': motions} : undefined,
        } : {
            FileReferences: {
                Textures: textures,
                Physics: physics,
                Pose: pose,
                Motions: motions.length ? {'': motions} : undefined,
            },
        };

        return true;
    }

    return (file.endsWith('model.json') || file.endsWith('model3.json')) && !modelBlacklist.includes(file);
});

console.log('Raw length', rawLength);
console.log('Final length', models.length);

const tree = groupByDir(models);

function groupByDir(arr) {
    const result = [];

    for (let i = 0; i < arr.length; i++) {
        const path = arr[i];
        const ids = path.split('/');

        if (ids.length) {
            const dir = ids[0] + '/';
            const sameDirs = arr.filter(path => path.startsWith(dir));

            if (sameDirs.length > 1) {
                const files = sameDirs.map(path => path.slice(dir.length));

                const grouped = groupByDir(files);

                const children = grouped.filter(item => typeof item === 'object');
                const subFiles = grouped.filter(item => typeof item === 'string');

                result.push({
                    name: dir.slice(0, -1),
                    children: children.length ? children : undefined,
                    files: subFiles.length ? subFiles : undefined,
                });

                i += sameDirs.length - 1;
            } else {
                result.push(path);
            }
        }
    }

    return result;
}

const content = JSON.stringify({
    models: {
        name: 'Eikanya/Live2d-model',
        children: tree.filter(item => typeof item === 'object'),
        files: tree.filter(item => typeof item === 'string'),
    },
    settings: settingsJSONs,
}, null, 2);

fs.writeFileSync('Eikanya/Live2d-model.json'.toLowerCase().replace('/', ''), content, 'utf8');


