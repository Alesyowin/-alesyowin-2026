const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /\#d97706/gi, replace: '#00A5FF' },
  { search: /\#3d2a00/gi, replace: '#002244' },
  { search: /\#ffda6b/gi, replace: '#66ccff' },
  { search: /\#6b4e00/gi, replace: '#0055aa' },
  { search: /\#b38600/gi, replace: '#008ecc' },
  { search: /\#ffcc00/gi, replace: '#00A5FF' },
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
