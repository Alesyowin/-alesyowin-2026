const fs = require('fs');

const translations = {
  ro: {
    Hero: {
      title: "Mulțumim pentru răbdare!",
      subtitle: "Am revenit. Competiția merge mai departe."
    }
  },
  en: {
    Hero: {
      title: "Thank you for your patience!",
      subtitle: "We are back. The competition continues."
    }
  },
  es: {
    Hero: {
      title: "¡Gracias por su paciencia!",
      subtitle: "Estamos de vuelta. La competición continúa."
    }
  },
  fr: {
    Hero: {
      title: "Merci pour votre patience !",
      subtitle: "Nous sommes de retour. La compétition continue."
    }
  },
  it: {
    Hero: {
      title: "Grazie per la pazienza!",
      subtitle: "Siamo tornati. La competizione continua."
    }
  },
  de: {
    Hero: {
      title: "Danke für Ihre Geduld!",
      subtitle: "Wir sind zurück. Der Wettbewerb geht weiter."
    }
  }
};

const locales = ['ro', 'en', 'es', 'fr', 'it', 'de'];

locales.forEach(locale => {
  const file = `messages/${locale}.json`;
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  // Add or update Hero translations
  data.Hero = translations[locale].Hero;
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Updated ${file}`);
});
