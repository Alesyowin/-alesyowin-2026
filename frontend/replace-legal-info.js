const fs = require('fs');
const path = require('path');

// Fișierele de traduceri
const messagesDir = path.join(__dirname, 'messages');
const files = ['ro.json', 'en.json', 'es.json', 'fr.json', 'it.json', 'de.json'];

// Înlocuiri text
const replacements = [
  // Numele companiei
  { search: /GP PROMOTIONS LTD/g, replace: 'Alesyo Win LTD' },
  { search: /GP Promotions LTD/g, replace: 'Alesyo Win LTD' },
  { search: /GP Promotions Ltd/g, replace: 'Alesyo Win LTD' },
  
  // Company Number
  { search: /17127347/g, replace: '16737234' },
  
  // Adresa veche - variante complete
  { search: /71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom/g, replace: '54 Market Street, Eastleigh, SO50 5RB, United Kingdom' },
  { search: /71-75 Shelton Street, Covent Garden, London, WC2H 9JQ/g, replace: '54 Market Street, Eastleigh, SO50 5RB, United Kingdom' },
  // Variante traduse ale adresei (dacă există)
  { search: /71-75 Shelton Street, Covent Garden, Londra, WC2H 9JQ, Regatul Unit/g, replace: '54 Market Street, Eastleigh, SO50 5RB, Regatul Unit' },
  { search: /71-75 Shelton Street, Covent Garden, Londres, WC2H 9JQ, Reino Unido/g, replace: '54 Market Street, Eastleigh, SO50 5RB, Reino Unido' },
  { search: /71-75 Shelton Street, Covent Garden, Londres, WC2H 9JQ, Royaume-Uni/g, replace: '54 Market Street, Eastleigh, SO50 5RB, Royaume-Uni' },
  { search: /71-75 Shelton Street, Covent Garden, Londra, WC2H 9JQ, Regno Unito/g, replace: '54 Market Street, Eastleigh, SO50 5RB, Regno Unito' },
  { search: /71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, Vereinigtes Königreich/g, replace: '54 Market Street, Eastleigh, SO50 5RB, Vereinigtes Königreich' },
  
  // Orice fragment rezidual al adresei vechi
  { search: /71-75 Shelton Street/g, replace: '54 Market Street' },
  { search: /Covent Garden, London/g, replace: 'Eastleigh' },
  { search: /WC2H 9JQ/g, replace: 'SO50 5RB' },
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
