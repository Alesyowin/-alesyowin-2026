const fs = require('fs');
const https = require('https');
const path = require('path');

const visaUrls = [
  'https://raw.githubusercontent.com/datatrans/payment-logos/master/logos/visa.svg',
  'https://raw.githubusercontent.com/datatrans/payment-logos/main/logos/visa.svg',
  'https://raw.githubusercontent.com/payrexx/payment-logos/master/logos/visa.svg',
  'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/master/flat/visa.svg',
  'https://raw.githubusercontent.com/slaterjohn/payment-logos/master/images/visa.svg'
];

const mastercardUrls = [
  'https://raw.githubusercontent.com/datatrans/payment-logos/master/logos/mastercard.svg',
  'https://raw.githubusercontent.com/datatrans/payment-logos/main/logos/mastercard.svg',
  'https://raw.githubusercontent.com/payrexx/payment-logos/master/logos/mastercard.svg',
  'https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/master/flat/mastercard.svg',
  'https://raw.githubusercontent.com/slaterjohn/payment-logos/master/images/mastercard.svg'
];

const downloadTry = (urls, dest) => {
  return new Promise((resolve, reject) => {
    let index = 0;

    const attempt = () => {
      if (index >= urls.length) {
        reject(new Error(`Failed to download from all sources for ${dest}`));
        return;
      }

      const url = urls[index];
      console.log(`Trying to download from: ${url}`);
      
      const file = fs.createWriteStream(dest);
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      };

      https.get(url, options, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Successfully downloaded ${url} to ${dest}`);
            resolve();
          });
        } else {
          file.close();
          fs.unlink(dest, () => {});
          console.log(`Source returned status ${response.statusCode}, trying next...`);
          index++;
          attempt();
        }
      }).on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        console.log(`Connection error: ${err.message}, trying next...`);
        index++;
        attempt();
      });
    };

    attempt();
  });
};

async function main() {
  const visaDest = path.join(__dirname, 'public', 'visa.svg');
  const mcDest = path.join(__dirname, 'public', 'mastercard.svg');

  try {
    // Ștergem PNG-urile vechi pentru a evita confuzia
    try {
      fs.unlinkSync(path.join(__dirname, 'public', 'visa.png'));
      fs.unlinkSync(path.join(__dirname, 'public', 'mastercard.png'));
    } catch(e) {}

    await downloadTry(visaUrls, visaDest);
    await downloadTry(mastercardUrls, mcDest);
    console.log('All SVG payment icons downloaded successfully!');
  } catch (error) {
    console.error('Download failed:', error.message);
    process.exit(1);
  }
}

main();
