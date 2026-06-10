// Script pentru actualizare manuală sold_tickets pe giveaway-uri
// Rulează cu: node fix-sold-tickets.mjs

const DIRECTUS_URL = 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';

async function fixSoldTickets() {
    console.log('🔧 Pornire script actualizare sold_tickets...');

    // 1. Obținem toate giveaway-urile
    const givRes = await fetch(`${DIRECTUS_URL}/items/giveaways?fields=id,title,total_tickets,sold_tickets`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    const givData = await givRes.json();
    const giveaways = givData.data || [];
    console.log(`📋 ${giveaways.length} giveaway-uri găsite`);

    for (const gw of giveaways) {
        // 2. Numărăm biletele reale din tabela tickets
        const tickRes = await fetch(
            `${DIRECTUS_URL}/items/tickets?filter[giveaway_id][_eq]=${gw.id}&aggregate[count]=id`,
            { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
        );
        const tickData = await tickRes.json();
        const realCount = parseInt(tickData.data?.[0]?.count?.id || 0, 10);

        console.log(`  Giveaway #${gw.id} (${gw.title}): DB=${gw.sold_tickets}, Real=${realCount}`);

        if (realCount !== gw.sold_tickets) {
            // 3. Actualizăm sold_tickets și tickets_left
            const updateRes = await fetch(`${DIRECTUS_URL}/items/giveaways/${gw.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${ADMIN_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sold_tickets: realCount,
                    tickets_left: Math.max(0, (gw.total_tickets || 0) - realCount),
                }),
            });
            if (updateRes.ok) {
                console.log(`  ✅ Actualizat! sold_tickets=${realCount}`);
            } else {
                const err = await updateRes.json();
                console.log(`  ❌ Eroare:`, err);
            }
        } else {
            console.log(`  ✓ Deja corect`);
        }
    }

    // 4. Actualizăm client_name pe biletele care nu au
    console.log('\n🎫 Actualizare client_name pe biletele fără nume...');
    const missingNameRes = await fetch(
        `${DIRECTUS_URL}/items/tickets?filter[client_name][_null]=true&fields=id,email,order_id&limit=200`,
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    );
    const missingData = await missingNameRes.json();
    const missing = missingData.data || [];
    console.log(`  ${missing.length} bilete fără client_name`);

    for (const ticket of missing) {
        // Căutăm comanda pentru a găsi customer_name
        const orderRes = await fetch(
            `${DIRECTUS_URL}/items/orders/${ticket.order_id}?fields=customer_name,client_email`,
            { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
        );
        const order = (await orderRes.json()).data;
        const name = order?.customer_name || order?.client_email || ticket.email;

        await fetch(`${DIRECTUS_URL}/items/tickets/${ticket.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ client_name: name }),
        });
    }
    if (missing.length > 0) console.log(`  ✅ ${missing.length} bilete actualizate cu client_name`);

    console.log('\n✨ Script finalizat!');
}

fixSoldTickets().catch(console.error);
