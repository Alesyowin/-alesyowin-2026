const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /\#8b6914/gi, replace: '#008ecc' },
  { search: /\#f0d060/gi, replace: '#3498db' },
  { search: /\#F0D060/g, replace: '#3498db' },
  { search: /\#c8a84b/gi, replace: '#00A5FF' },
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
