const { createDirectus, rest, staticToken } = require('@directus/sdk');

const DIRECTUS_URL = 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';

const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function addField() {
    try {
        // Directus System API per a afegir camps
        // Nota: Aquesta part depèn de permisiunile token-ului
        // De obicei se face prin POST /fields/:collection
        const response = await fetch(`${DIRECTUS_URL}/fields/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field: 'locale',
                type: 'string',
                meta: {
                    interface: 'input',
                    readonly: false,
                    hidden: false,
                    width: 'half'
                }
            })
        });
        const data = await response.json();
        console.log('Add Field Result:', data);
    } catch (err) {
        console.error(err);
    }
}

addField();
