import { createDirectus, rest, createItems } from '@directus/sdk';

const directus = createDirectus('https://alesyowin-backend.onrender.com').with(rest());
const token = 'Jy1TCQ0gxgmDBAimdfVqsqqDQYPrKXqr';

const updates = [
  {
    giveaways_id: 2,
    languages_code: 'en',
    title: 'Modern Seaside Apartment + £1,000 Pocket Money',
    subtitle: 'Cash Alternative: £40,000',
    description: `Discover a modern and perfectly located apartment, just a 3-minute walk from the beach. With a total area of 43 sqm, this property is intelligently designed for comfort and functionality.

The apartment includes:
* Two bright rooms, ideal for relaxing or sleeping
* A fully equipped kitchen, suitable for cooking or short stays
* A modern bathroom, arranged with practical design
* Entrance hall, offering additional storage space

This property is an excellent choice for vacations, investment, or living, located in a quiet area just steps away from the seaside.`
  },
  {
    giveaways_id: 2,
    languages_code: 'ro',
    title: 'Apartament modern la malul mării + 1.000 £ bani de buzunar',
    subtitle: 'Alternativă Cash: 40.000 £',
    description: `Descoperă un apartament modern și perfect amplasat, la doar 3 minute de mers pe jos de plajă. Cu o suprafață totală de 43 mp, această proprietate este proiectată inteligent pentru confort și funcționalitate.

Apartamentul include:
* Două camere luminoase, ideale pentru relaxare sau odihnă
* O bucătărie complet utilată, potrivită pentru gătit sau șederi scurte
* O baie modernă, amenajată cu un design practic
* Hol la intrare, oferind spațiu de depozitare suplimentar

Această proprietate este o alegere excelentă pentru vacanțe, investiție sau locuire, fiind situată într-o zonă liniștită la câțiva pași de malul mării.`
  },
  {
    giveaways_id: 2,
    languages_code: 'es',
    title: 'Moderno apartamento junto al mar + 1.000 £ de dinero de bolsillo',
    subtitle: 'Alternativa en efectivo: 40.000 £',
    description: `Descubra un apartamento moderno y perfectamente ubicado, a solo 3 minutos a pie de la playa. Con una superficie total de 43 m², esta propiedad está diseñada de forma inteligente para ofrecer comodidad y funcionalidad.

El apartamento incluye:
* Dos habitaciones luminosas, ideales para relajarse o dormir
* Una cocina totalmente equipada, adecuada para cocinar o para estancias cortas
* Un baño moderno, con un diseño práctico
* Vestíbulo de entrada, que ofrece espacio de almacenamiento adicional

Esta propiedad es una excelente opción para vacaciones, inversión o vivienda, ubicada en una zona tranquila a pocos pasos de la orilla del mar.`
  },
  {
    giveaways_id: 2,
    languages_code: 'fr',
    title: 'Appartement moderne en bord de mer + 1 000 £ d\'argent de poche',
    subtitle: 'Alternative en espèces : 40 000 £',
    description: `Découvrez un appartement moderne et idéalement situé, à seulement 3 minutes à pied de la plage. D'une superficie totale de 43 m², cette propriété est intelligemment conçue pour offrir confort et fonctionnalité.

L'appartement comprend :
* Deux pièces lumineuses, idéales pour se détendre ou dormir
* Une cuisine entièrement équipée, adaptée pour cuisiner ou pour de courts séjours
* Une salle de bain moderne, aménagée avec un design pratique
* Hall d'entrée, offrant un espace de rangement supplémentaire

Cette propriété est un excellent choix pour les vacances, un investissement ou y vivre, située dans un quartier calme à quelques pas du bord de mer.`
  },
  {
    giveaways_id: 2,
    languages_code: 'it',
    title: 'Moderno appartamento sul mare + 1.000 £ di paghetta',
    subtitle: 'Alternativa in contanti: 40.000 £',
    description: `Scopri un appartamento moderno e perfettamente situato, a soli 3 minuti a piedi dalla spiaggia. Con una superficie totale di 43 mq, questa proprietà è progettata in modo intelligente per offrire comfort e funzionalità.

L'appartamento comprende:
* Due stanze luminose, ideali per rilassarsi o dormire
* Una cucina completamente attrezzata, adatta per cucinare o per brevi soggiorni
* Un bagno moderno, arredato con un design pratico
* Ingresso, che offre spazio di archiviazione aggiuntivo

Questa proprietà è un'ottima scelta per le vacanze, come investimento o per viverci, situata in una zona tranquilla a pochi passi dal mare.`
  },
  {
    giveaways_id: 2,
    languages_code: 'de',
    title: 'Modernes Apartment am Meer + 1.000 £ Taschengeld',
    subtitle: 'Bargeldalternative: 40.000 £',
    description: `Entdecken Sie ein modernes und perfekt gelegenes Apartment, nur 3 Gehminuten vom Strand entfernt. Mit einer Gesamtfläche von 43 m² ist diese Immobilie intelligent auf Komfort und Funktionalität ausgelegt.

Das Apartment bietet:
* Zwei helle Räume, ideal zum Entspannen oder Schlafen
* Eine voll ausgestattete Küche, geeignet zum Kochen oder für Kurzaufenthalte
* Ein modernes Badezimmer mit praktischem Design
* Eingangsbereich mit zusätzlichem Stauraum

Diese Immobilie ist eine ausgezeichnete Wahl für Urlaub, als Investition oder zum Wohnen. Sie liegt in einer ruhigen Gegend, nur wenige Schritte vom Meer entfernt.`
  }
];

async function insertTranslations() {
  try {
    const result = await directus.request(createItems('giveaways_translations', updates), {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Translations INSERTED successfully!", result.length);
  } catch (error) {
    console.error("Error inserting translations:", JSON.stringify(error, null, 2));
  }
}

insertTranslations();
