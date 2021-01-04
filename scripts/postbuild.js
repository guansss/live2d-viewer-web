const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../dist');

function main() {
    const files = fs.readdirSync(outDir);

    for (const file of files) {
        // minimize JSONs
        if (file.endsWith('.json')) {
            const filePath = path.resolve(outDir, file);

            console.log('Minimizing', filePath);

            let content = fs.readFileSync(filePath, 'utf8');

            content = JSON.stringify(JSON.parse(content));

            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
}

main();
