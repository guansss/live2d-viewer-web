export interface TreeNode {
    id: number;
    name: string;
    children?: TreeNode[];
    files?: string[];
}

let uid = 0;

const tasks = new Map<TreeNode, Promise<void>>();

const rootNodes: TreeNode[] = [{
    id: uid++,
    name: 'Eikanya/Live2d-model',
    children: [],
    files: [],
}];

// preload
rootNodes.forEach(loadRootNode);

export function getRootNodes(): TreeNode[] {
    return rootNodes;
}

export function loadRootNode(node: TreeNode): Promise<void> {
    if (!tasks.get(node)) {
        const task = fetch(node.name.toLowerCase().replace('/', '') + '.json')
            .then(res => res.json())
            .then(data => {
                node.name = data.models.name;
                node.children = data.models.children;
                node.files = data.models.files;

                forEachNode(node, n => n.id = uid++);
            });

        tasks.set(node, task);

        return task;
    }

    return tasks.get(node)!;
}

export function forEachNode(node: TreeNode, fn: (node: TreeNode) => void) {
    fn(node);

    if (node.children) {
        for (const child of node.children) {
            forEachNode(child, fn);
        }
    }
}

export function getFileURL(folder: TreeNode, file: string): string | undefined {
    const folderPath = getNodePath(folder);

    if (folderPath) {
        const filePath = encodeURI(folderPath + '/' + file);

        return `https://cdn.jsdelivr.net/gh/${filePath}`;
    }
}

export function getAlternativeURL(url: string): string {
    // raw: "https://cdn.jsdelivr.net/gh/<repo>/<file>"
    // alt: "https://raw.githubusercontent.com/<repo>/master/<file>"

    const repoAndFile = url.replace('https://cdn.jsdelivr.net/gh/', '');
    const names = repoAndFile.split('/');
    const repo = names.slice(0, 2).join('/');
    const file = names.slice(2).join('/');

    return `https://raw.githubusercontent.com/${repo}/master/${file}`;
}

export function getNodePath(node: TreeNode): string | undefined {
    const search = (nodes: TreeNode[]): string | undefined => {
        for (const _node of nodes) {
            if (_node === node) {
                return _node.name;
            }

            if (_node.children) {
                const subPath = search(_node.children);

                if (subPath) {
                    return _node.name + '/' + subPath;
                }
            }
        }
    };

    return search(rootNodes);
}
