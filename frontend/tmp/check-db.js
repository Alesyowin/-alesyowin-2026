const { createDirectus, rest, readItems, staticToken } = require('@directus/sdk');

const DIRECTUS_URL = 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';

const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function checkFields() {
    try {
        const orders = await client.request(readItems('orders', { limit: 1 }));
        console.log('--- Orders Fields ---');
        console.log(Object.keys(orders[0] || {}).join(', '));
        
        const tickets = await client.request(readItems('tickets', { limit: 1 }));
        console.log('\n--- Tickets Fields ---');
        console.log(Object.keys(tickets[0] || {}).join(', '));
        
        const items = await client.request(readItems('order_items', { limit: 1 }));
        console.log('\n--- Order Items Fields ---');
        console.log(Object.keys(items[0] || {}).join(', '));
        
    } catch (err) {
        console.error(err);
    }
}

checkFields();
