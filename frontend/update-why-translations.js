const fs = require('fs');

const featuresTranslations = {
  ro: {
    title: "De ce să ne alegi pe noi",
    subtitle: "O platformă de încredere, creată pentru o experiență transparentă și corectă.",
    f1_title: "Transparență 100%",
    f1_desc: "Fiecare extragere este realizată la vedere, printr-un sistem demonstrabil echitabil.",
    f2_title: "Premii Autentice",
    f2_desc: "Garantăm autenticitatea și calitatea premium pentru fiecare premiu pe care îl câștigi.",
    f3_title: "Plăți Securizate",
    f3_desc: "Tranzacțiile tale sunt protejate cu cele mai înalte standarde de securitate din industrie.",
    f4_title: "Comunitate Unită",
    f4_desc: "Alătură-te unei comunități de pasionați, unde norocul se întâlnește cu premii de neuitat."
  },
  en: {
    title: "Why Choose Us",
    subtitle: "A trusted platform, built for a transparent and fair experience.",
    f1_title: "100% Transparency",
    f1_desc: "Every draw is conducted openly through a provably fair system.",
    f2_title: "Authentic Prizes",
    f2_desc: "We guarantee the authenticity and premium quality of every prize you win.",
    f3_title: "Secure Payments",
    f3_desc: "Your transactions are protected with the highest security standards in the industry.",
    f4_title: "United Community",
    f4_desc: "Join a community of enthusiasts where luck meets unforgettable rewards."
  },
  es: {
    title: "Por qué elegirnos",
    subtitle: "Una plataforma de confianza, creada para una experiencia transparente y justa.",
    f1_title: "Transparencia 100%",
    f1_desc: "Cada sorteo se realiza de forma abierta a través de un sistema demostrablemente justo.",
    f2_title: "Premios Auténticos",
    f2_desc: "Garantizamos la autenticidad y la calidad premium de cada premio que ganes.",
    f3_title: "Pagos Seguros",
    f3_desc: "Tus transacciones están protegidas con los más altos estándares de seguridad de la industria.",
    f4_title: "Comunidad Unida",
    f4_desc: "Únete a una comunidad de entusiastas donde la suerte se encuentra con recompensas inolvidables."
  },
  fr: {
    title: "Pourquoi nous choisir",
    subtitle: "Une plateforme de confiance, conçue pour une expérience transparente et équitable.",
    f1_title: "Transparence 100%",
    f1_desc: "Chaque tirage est effectué ouvertement via un système prouvablement équitable.",
    f2_title: "Prix Authentiques",
    f2_desc: "Nous garantissons l'authenticité et la qualité premium de chaque prix que vous gagnez.",
    f3_title: "Paiements Sécurisés",
    f3_desc: "Vos transactions sont protégées avec les normes de sécurité les plus élevées de l'industrie.",
    f4_title: "Communauté Unie",
    f4_desc: "Rejoignez une communauté de passionnés où la chance rencontre des récompenses inoubliables."
  },
  it: {
    title: "Perché sceglierci",
    subtitle: "Una piattaforma di fiducia, costruita per un'esperienza trasparente ed equa.",
    f1_title: "Trasparenza al 100%",
    f1_desc: "Ogni estrazione viene condotta apertamente attraverso un sistema dimostrabilmente equo.",
    f2_title: "Premi Autentici",
    f2_desc: "Garantiamo l'autenticità e la qualità premium di ogni premio che vinci.",
    f3_title: "Pagamenti Sicuri",
    f3_desc: "Le tue transazioni sono protette con i più alti standard di sicurezza del settore.",
    f4_title: "Comunità Unita",
    f4_desc: "Unisciti a una comunità di appassionati dove la fortuna incontra ricompense indimenticabili."
  },
  de: {
    title: "Warum uns wählen",
    subtitle: "Eine vertrauenswürdige Plattform, gebaut für eine transparente und faire Erfahrung.",
    f1_title: "100% Transparenz",
    f1_desc: "Jede Ziehung wird offen durch ein nachweislich faires System durchgeführt.",
    f2_title: "Authentische Preise",
    f2_desc: "Wir garantieren die Authentizität und Premium-Qualität jedes Preises, den Sie gewinnen.",
    f3_title: "Sichere Zahlungen",
    f3_desc: "Ihre Transaktionen sind mit den höchsten Sicherheitsstandards der Branche geschützt.",
    f4_title: "Vereinte Community",
    f4_desc: "Schließen Sie sich einer Gemeinschaft von Enthusiasten an, in der Glück auf unvergessliche Belohnungen trifft."
  }
};

const locales = ['ro', 'en', 'es', 'fr', 'it', 'de'];

locales.forEach(locale => {
  const file = `messages/${locale}.json`;
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (!data.Home) data.Home = {};
  data.Home.features = featuresTranslations[locale];
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Updated ${file}`);
});
