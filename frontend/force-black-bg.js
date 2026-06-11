const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'terms/page.tsx',
    'privacy/page.tsx',
    'rules/page.tsx',
    'postal-entry/page.tsx',
    'cookies/page.tsx',
    'faq/page.tsx'
];

const basePath = path.join(__dirname, 'src/app/[locale]');

filesToUpdate.forEach(file => {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Înlocuim bg-(--color-black-pure) cu bg-black pentru a forța fundalul negru
        content = content.replace(/bg-\(--color-black-pure\)/g, 'bg-black');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
