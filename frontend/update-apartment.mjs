import { createDirectus, rest, readItem, updateItem } from '@directus/sdk';

const directus = createDirectus('https://alesyowin-backend.onrender.com').with(rest());
const token = 'Jy1TCQ0gxgmDBAimdfVqsqqDQYPrKXqr';

const updates = [
  {
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
    languages_code: 'ro',
    title: 'Apartament Modern la Mare + 1.000 £ Bani de Buzunar',
    subtitle: 'Alternativă Cash: 40.000 £',
    description: `Descoperă un apartament modern și perfect amplasat, la doar 3 minute de mers pe jos de plajă. Cu o suprafață totală de 43 mp, această proprietate este proiectată inteligent pentru confort și funcționalitate.

Apartamentul include:
* Două camere luminoase, ideale pentru relaxare sau odihnă
* O bucătărie complet utilată, potrivită pentru gătit sau șederi scurte
* O baie modernă, amenajată cu un design practic
* Hol de la intrare, oferind spațiu de depozitare suplimentar

Această proprietate este o alegere excelentă pentru vacanțe, investiție sau locuire, fiind situată într-o zonă liniștită la câțiva pași de malul mării.`
  },
  {
    languages_code: 'es',
    title: 'Moderno Apartamento junto al Mar + 1.000 £ de Dinero de Bolsillo',
    subtitle: 'Alternativa en Efectivo: 40.000 £',
    description: `Descubra un apartamento moderno y perfectamente ubicado, a solo 3 minutos a pie de la playa. Con una superficie total de 43 m², esta propiedad está diseñada de forma inteligente para ofrecer comodidad y funcionalidad.

El apartamento incluye:
* Dos habitaciones luminosas, ideales para relajarse o dormir
* Una cocina totalmente equipada, adecuada para cocinar o para estancias cortas
* Un baño moderno, con un diseño práctico
* Vestíbulo de entrada, que ofrece espacio de almacenamiento adicional

Esta propiedad es una excelente opción para vacaciones, inversión o vivienda, ubicada en una zona tranquila a pocos pasos de la orilla del mar.`
  },
  {
    languages_code: 'fr',
    title: 'Appartement Moderne en Bord de Mer + 1 000 £ d\'Argent de Poche',
    subtitle: 'Alternative en Espèces : 40 000 £',
    description: `Découvrez un appartement moderne et idéalement situé, à seulement 3 minutes à pied de la plage. D'une superficie totale de 43 m², cette propriété est intelligemment conçue pour offrir confort et fonctionnalité.

L'appartement comprend :
* Deux pièces lumineuses, idéales pour se détendre ou dormir
* Une cuisine entièrement équipée, adaptée pour cuisiner ou pour de courts séjours
* Une salle de bain moderne, aménagée avec un design pratique
* Hall d'entrée, offrant un espace de rangement supplémentaire

Cette propriété est un excellent choix pour les vacances, un investissement ou y vivre, située dans un quartier calme à quelques pas du bord de mer.`
  },
  {
    languages_code: 'it',
    title: 'Moderno Appartamento al Mare + 1.000 £ di Paghetta',
    subtitle: 'Alternativa in Contanti: 40.000 £',
    description: `Scopri un appartamento moderno e perfettamente situato, a soli 3 minuti a piedi dalla spiaggia. Con una superficie totale di 43 mq, questa proprietà è progettata in modo intelligente per offrire comfort e funzionalità.

L'appartamento comprende:
* Due stanze luminose, ideali per rilassarsi o dormire
* Una cucina completamente attrezzata, adatta per cucinare o per brevi soggiorni
* Un bagno moderno, arredato con un design pratico
* Ingresso, che offre spazio di archiviazione aggiuntivo

Questa proprietà è un'ottima scelta per le vacanze, come investimento o per viverci, situata in una zona tranquilla a pochi passi dal mare.`
  },
  {
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

async function updateTranslations() {
  try {
    const item = await directus.request(readItem('giveaways', 2, { fields: ['translations.*'] }), {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    // We update existing or create new translations
    const existingTranslations = item.translations || [];
    
    const newTranslations = updates.map(update => {
      const existing = existingTranslations.find(t => t.languages_code === update.languages_code);
      if (existing) {
        return {
          ...existing,
          title: update.title,
          subtitle: update.subtitle,
          description: update.description,
        };
      }
      return update;
    });

    await directus.request(updateItem('giveaways', 2, {
      translations: newTranslations
    }), {
        headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Translations updated successfully!");
  } catch (error) {
    console.error("Error updating translations:", error);
  }
}

updateTranslations();
