const { createDirectus, rest, readItems, staticToken } = require('@directus/sdk');

const DIRECTUS_URL = 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';

async function explore() {
    const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

    try {
        console.log('--- Order 112 Details ---');
        const orders = await client.request(readItems('orders', { 
            filter: { id: { _eq: 112 } },
            fields: ['*'] 
        }));
        console.log(JSON.stringify(orders[0], null, 2));

        // Let's also check if there's a 'ticket' or 'tickets' relation
        console.log('--- Checking Relations ---');
        // We can't easily list relations via SDK without schema, but we can try to fetch them
        const orderWithTickets = await client.request(readItems('orders', { 
            filter: { id: { _eq: 112 } },
            fields: ['id', 'ticket.*', 'tickets.*'] 
        }));
        console.log(JSON.stringify(orderWithTickets[0], null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

explore();
