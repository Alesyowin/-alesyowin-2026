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

        // Înlocuiri pentru culoarea albastră
        content = content.replace(/bg-\(--color-gold\)/g, 'bg-[#00A5FF]');
        content = content.replace(/text-\(--color-gold\)/g, 'text-[#00A5FF]');

        // Înlocuiri pentru text alb lucios (îndepărtăm griurile)
        content = content.replace(/text-gray-200/g, 'text-white');
        content = content.replace(/text-gray-300/g, 'text-white');
        content = content.replace(/text-gray-400/g, 'text-white');
        content = content.replace(/text-gray-500/g, 'text-white');

        // Fundal negru pur și pentru casetele de text
        content = content.replace(/bg-\[\#111\]/g, 'bg-black');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
