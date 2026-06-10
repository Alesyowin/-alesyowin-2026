const { createDirectus, rest, readItems, staticToken } = require('@directus/sdk');

const DIRECTUS_URL = 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';

async function explore() {
    const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

    try {
        console.log('--- Order Sample ---');
        const orders = await client.request(readItems('orders', { limit: 1 }));
        console.log(JSON.stringify(orders[0], null, 2));

        console.log('--- Ticket Sample ---');
        const tickets = await client.request(readItems('tickets', { limit: 1 }));
        console.log(JSON.stringify(tickets[0], null, 2));
        
        console.log('--- Giveaway Sample ---');
        const giveaways = await client.request(readItems('giveaways', { limit: 1 }));
        console.log(JSON.stringify(giveaways[0], null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

explore();
