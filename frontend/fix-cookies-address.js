const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');
const files = ['en.json', 'de.json', 'es.json', 'fr.json', 'it.json', 'ro.json'];

const replacements = [
  // Curățăm adresele reziduale cu Covent Garden din secțiunea Cookies
  { search: /54 Market Street, Covent Garden,\\nLondon,/g, replace: '54 Market Street, Eastleigh,\\n' },
  { search: /54 Market Street, Covent Garden,\\nLondra,/g, replace: '54 Market Street, Eastleigh,\\n' },
  { search: /54 Market Street, Covent Garden,\\nLondres,/g, replace: '54 Market Street, Eastleigh,\\n' },
  // Varianta din de.json - London cu Vereinigtes Königreich
  { search: /54 Market Street, Covent Garden,/g, replace: '54 Market Street, Eastleigh,' },
];

let totalChanges = 0;

files.forEach(file => {
  const filePath = path.join(messagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  replacements.forEach(({ search, replace }) => {
    newContent = newContent.replace(search, replace);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${file}`);
    totalChanges++;
  } else {
    console.log(`No changes in ${file}`);
  }
});

console.log(`\nTotal files modified: ${totalChanges}`);
