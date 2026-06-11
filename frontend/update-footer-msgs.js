const fs = require('fs');
const path = require('path');
const files = {
  'en.json': {
    joinFamily: 'Join the Alesyowin family today!',
    companyDetailsName: 'Alesyo Win LTD',
    companyDetailsNumber: 'Company Number: 16737234',
    companyDetailsAddressTitle: 'Registered Office Address:',
    companyDetailsAddress: '54 Market Street, Eastleigh, England, SO50 5RB, United Kingdom'
  },
  'ro.json': {
    joinFamily: 'Alătură-te familiei Alesyowin astăzi!',
    companyDetailsName: 'Alesyo Win LTD',
    companyDetailsNumber: 'Număr companie: 16737234',
    companyDetailsAddressTitle: 'Adresă sediu social:',
    companyDetailsAddress: '54 Market Street, Eastleigh, England, SO50 5RB, Regatul Unit'
  },
  'de.json': {
    joinFamily: 'Treten Sie noch heute der Alesyowin-Familie bei!',
    companyDetailsName: 'Alesyo Win LTD',
    companyDetailsNumber: 'Firmennummer: 16737234',
    companyDetailsAddressTitle: 'Adresse des eingetragenen Firmensitzes:',
    companyDetailsAddress: '54 Market Street, Eastleigh, England, SO50 5RB, Vereinigtes Königreich'
  },
  'es.json': {
    joinFamily: '¡Únete a la familia Alesyowin hoy!',
    companyDetailsName: 'Alesyo Win LTD',
    companyDetailsNumber: 'Número de la empresa: 16737234',
    companyDetailsAddressTitle: 'Dirección del domicilio social:',
    companyDetailsAddress: '54 Market Street, Eastleigh, England, SO50 5RB, Reino Unido'
  },
  'fr.json': {
    joinFamily: 'Rejoignez la famille Alesyowin aujourd\'hui !',
    companyDetailsName: 'Alesyo Win LTD',
    companyDetailsNumber: 'Numéro d\'entreprise: 16737234',
    companyDetailsAddressTitle: 'Adresse du siège social:',
    companyDetailsAddress: '54 Market Street, Eastleigh, England, SO50 5RB, Royaume-Uni'
  },
  'it.json': {
    joinFamily: 'Unisciti oggi alla famiglia Alesyowin!',
    companyDetailsName: 'Alesyo Win LTD',
    companyDetailsNumber: 'Numero di società: 16737234',
    companyDetailsAddressTitle: 'Indirizzo della sede legale:',
    companyDetailsAddress: '54 Market Street, Eastleigh, England, SO50 5RB, Regno Unito'
  }
};

const messagesDir = path.join(__dirname, 'messages');

for (const [file, translations] of Object.entries(files)) {
  const filePath = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.Footer) data.Footer = {};
  data.Footer.joinFamily = translations.joinFamily;
  data.Footer.companyDetailsName = translations.companyDetailsName;
  data.Footer.companyDetailsNumber = translations.companyDetailsNumber;
  data.Footer.companyDetailsAddressTitle = translations.companyDetailsAddressTitle;
  data.Footer.companyDetailsAddress = translations.companyDetailsAddress;
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${file}`);
}
