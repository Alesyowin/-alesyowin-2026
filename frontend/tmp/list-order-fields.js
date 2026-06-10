const { createDirectus, rest, staticToken } = require('@directus/sdk');

const DIRECTUS_URL = 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';

const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function listFields() {
    try {
        const response = await fetch(`${DIRECTUS_URL}/fields/orders`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        const data = await response.json();
        console.log('Fields in orders:', data.data.map(f => f.field).join(', '));
    } catch (err) {
        console.error(err);
    }
}

listFields();
