const token = 'Jy1TCQ0gxgmDBAimdfVqsqqDQYPrKXqr';
const url = `https://alesyowin-backend.onrender.com/items/giveaways_translations?access_token=${token}`;

const updates = [
  {
    giveaways_id: 4,
    languages_code: 'en',
    title: 'Apple Experience Pack',
    description: 'Apple MacBook Pro 14" Laptop, Apple iPhone 17 Pro Max 5G 1TB Silver, Apple AirPods Pro 3 Earbuds'
  },
  {
    giveaways_id: 4,
    languages_code: 'ro',
    title: 'Pachet Experiență Apple',
    description: 'Laptop Apple MacBook Pro 14", Apple iPhone 17 Pro Max 5G 1TB Argintiu, Căști Apple AirPods Pro 3'
  },
  {
    giveaways_id: 4,
    languages_code: 'es',
    title: 'Paquete Experiencia Apple',
    description: 'Portátil Apple MacBook Pro 14", Apple iPhone 17 Pro Max 5G 1TB Plata, Auriculares Apple AirPods Pro 3'
  },
  {
    giveaways_id: 4,
    languages_code: 'fr',
    title: 'Pack Expérience Apple',
    description: 'Ordinateur portable Apple MacBook Pro 14", Apple iPhone 17 Pro Max 5G 1 To Argent, Écouteurs Apple AirPods Pro 3'
  },
  {
    giveaways_id: 4,
    languages_code: 'it',
    title: 'Pacchetto Esperienza Apple',
    description: 'Laptop Apple MacBook Pro 14", Apple iPhone 17 Pro Max 5G 1TB Argento, Auricolari Apple AirPods Pro 3'
  },
  {
    giveaways_id: 4,
    languages_code: 'de',
    title: 'Apple Erlebnis-Paket',
    description: 'Apple MacBook Pro 14" Laptop, Apple iPhone 17 Pro Max 5G 1TB Silber, Apple AirPods Pro 3 Kopfhörer'
  }
];

async function insertDirectly() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    if (!res.ok) {
        const text = await res.text();
        console.error("Failed to insert:", res.status, text);
        return;
    }
    
    const data = await res.json();
    console.log("SUCCESS! Inserted:", data.data.length, "translations.");
  } catch(e) {
      console.error(e);
  }
}

insertDirectly();
