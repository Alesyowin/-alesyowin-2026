const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /from-\[\#EFD584\] via-\[\#D4AF37\] to-\[\#B38D22\]/g, replace: 'from-[#3498db] via-[#00A5FF] to-[#008ecc]' },
  { search: /from-\[\#8b6914\] via-\[\#D4AF37\] to-\[\#f0d060\]/g, replace: 'from-[#008ecc] via-[#00A5FF] to-[#3498db]' },
  { search: /rgba\(212,\s*175,\s*55,/g, replace: 'rgba(0,165,255,' },
  { search: /\#D4AF37/gi, replace: '#00A5FF' },
  { search: /\#FFD700/gi, replace: '#00A5FF' },
];

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && /\.(tsx|ts|css)$/.test(filepath)) {
      callback(filepath);
    }
  });
}

let modifiedCount = 0;

walkSync('src', (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let newContent = content;
  
  replacements.forEach(({ search, replace }) => {
    newContent = newContent.replace(search, replace);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`Updated ${filepath}`);
    modifiedCount++;
  }
});

console.log(`Total files modified: ${modifiedCount}`);
