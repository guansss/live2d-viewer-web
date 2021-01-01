const fs = require('fs');
const fetch = require('node-fetch');

const repos = [
    'Eikanya/Live2d-model',
    // 'xiaoski/live2d_models_collection',
];

function normalize(repo) {
    return repo.toLowerCase().replace(/\//g, '');
}

const tasks = repos.map(async repo => {
    const tree = await fetchTree({
        url: `https://api.github.com/repos/${repo}/git/trees/master`,
    }, true);

    fs.writeFileSync(normalize(repo) + '-tree.json', JSON.stringify(tree), 'utf8');
});

async function fetchTree(tree, skipRecursive) {
    let data;

    if (!skipRecursive) {
        data = await fetchJSON(tree.url + '?recursive=true');
    }

    const result = {
        path: tree.path,
        tree: [],
    };

    if (skipRecursive || data.truncated) {
        console.log('TRUNCATED', tree.url);

        // no recursive
        data = await fetchJSON(tree.url, true);

        if (data.tree) {
            for (let i in data.tree) {
                const node = data.tree[i];
                if (node.type === 'tree') {
                    try {
                        result.tree[i] = await fetchTree(node);
                    } catch (e) {
                        console.log(e);
                    }
                } else {
                    result.tree[i] = node.path;
                }
            }
        }
    } else if (data.tree) {
        result.tree = data.tree.map(node => node.path);
    } else {
        result.tree.push(data.path);
    }

    return result;
}

async function fetchJSON(url) {
    console.log('fetch', url);

    const file = 'json/' + normalize(url.slice('https://api.github.com/repos/'.length).replace('?recursive=true', '-rec')) + '.json';

    if (fs.existsSync(file)) {
        console.log('Read cache', file);

        const data = fs.readFileSync(file, 'utf8');

        return JSON.parse(data);
    }

    const data = await fetch(url).then(res => res.json());

    if (data.message) {
        throw  new Error(data.message);
    }

    console.log('Write cache', file);
    fs.writeFileSync(file, JSON.stringify(data), 'utf8');

    return data;
}
