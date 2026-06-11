const fs = require('fs');

const translations = {
  ro: {
    title: "Competiții în desfășurare",
    description: "Participă acum pentru șansa de a câștiga premii speciale. Fiecare bilet te aduce mai aproape de recompense incredibile."
  },
  en: {
    title: "Ongoing Competitions",
    description: "Enter now for a chance to win special prizes. Every ticket brings you closer to incredible rewards."
  },
  es: {
    title: "Competiciones en curso",
    description: "Participa ahora para tener la oportunidad de ganar premios especiales. Cada boleto te acerca a increíbles recompensas."
  },
  fr: {
    title: "Compétitions en cours",
    description: "Participez maintenant pour avoir la chance de gagner des prix spéciaux. Chaque billet vous rapproche de récompenses incroyables."
  },
  it: {
    title: "Competizioni in corso",
    description: "Partecipa ora per avere la possibilità di vincere premi speciali. Ogni biglietto ti avvicina a incredibili ricompense."
  },
  de: {
    title: "Laufende Wettbewerbe",
    description: "Nehmen Sie jetzt teil und gewinnen Sie besondere Preise. Jedes Los bringt Sie unglaublichen Belohnungen näher."
  }
};

const locales = ['ro', 'en', 'es', 'fr', 'it', 'de'];

locales.forEach(locale => {
  const file = `messages/${locale}.json`;
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (!data.Home) data.Home = {};
  data.Home.title = translations[locale].title;
  data.Home.description = translations[locale].description;
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Updated ${file}`);
});
