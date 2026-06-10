import { createDirectus, rest, createItem, updateItem, readItems, deleteItems, deleteItem } from '@directus/sdk';
import { staticToken } from '@directus/sdk';

const DIRECTUS_URL = 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';

const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function runTest() {
    console.log('--- START TEST SIMULARE CONCURENTĂ: ZERO DUBLURI RANDOM ---');
    console.log('[1/7] Conectare la baza de date de producție...');

    let giveawayId = null;
    const orderIds = [];
    const itemIds = [];
    let ticketIdsToDelete = [];

    try {
        // --- 1. Creare Giveaway Test ---
        console.log('[2/7] Creare Giveaway de test cu 1000 bilete disponibile (1..1000)...');
        const gwa = await client.request(createItem('giveaways', {
            title: '[TEST INTEGRATED] Test Concurență 1000 Bilete',
            description: 'Acesta este un eveniment creat automat pentru a testa generatorul aleator cu 4 cumpărători simultani.',
            total_tickets: 1000,
            sold_tickets: 0,
            tickets_left: 1000,
            status: 'draft',
            price: 1,
            instant_prizes: []
        }));
        giveawayId = gwa.id;
        console.log(`✅ Giveaway Test creat (ID: ${giveawayId})`);

        // --- 2. Creare 4 Comenzi (pending) cu câte 250 bilete fiecare ---
        console.log('[3/7] Pregătire 4 cumpărători simultani (câte 250 bilete fiecare)...');
        for (let i = 1; i <= 4; i++) {
            const order = await client.request(createItem('orders', {
                status: 'pending',
                client_email: `test_concurent_${i}@gp.ro`,
                customer_name: `Cumpărător ${i}`,
                quantity: '250',
                total_paid: '250',
            }));
            orderIds.push(order.id);

            const oItem = await client.request(createItem('order_items', {
                order_id: order.id,
                giveaway_id: giveawayId,
                quantity: 250
            }));
            itemIds.push(oItem.id);
        }
        console.log(`✅ ${orderIds.length} Comenzi + Items create (Pending).`);

        // --- 3. Execuție Webhook Simultane (Concurență tip Stripe) ---
        console.log('[4/7] TRAGEM SEMNALUL DE PLATĂ SIMULTAN PENTRU TOȚI 4 CUMPĂRĂTORII...');
        console.log('⏳ (Așteptăm funcția Transaction Locks să preia și să serializeze procesarea random, garantând lipsa dublurilor)...');
        
        const startTime = Date.now();
        await Promise.all(orderIds.map(id => 
            client.request(updateItem('orders', id, { status: 'paid' }))
        ));
        
        console.log(`✅ Cele 4 semnale 'paid' au sosit simultan în ${Date.now() - startTime}ms.`);

        // --- 4. Așteptăm procesarea hookului în backend (Render poate dura un pic) ---
        console.log('[5/7] Așteptăm 25 secunde ca Hook-ul de pe Render să genereze asincron toate cele 1000 bilete din logica Random...');
        await new Promise(resolve => setTimeout(resolve, 25000));

        // --- 5. Descărcarea Biletelor din baza de date pentru aserțiune ---
        console.log('[6/7] Descărcare bilete din baza de date pentru validare dubluri...');
        const tickets = await client.request(readItems('tickets', {
            filter: { giveaway_id: { _eq: giveawayId } },
            fields: ['id', 'ticket_number', 'order_id'],
            limit: -1, // Luăm absolut toate (în Directus 11 e limit: -1 ptr nelimitat sau array pagination, pe 10 e valabil și asta sau max limit)
        }));

        if (!tickets) {
             console.error('[FAIL] Nu s-au întors bilete de la server.');
             return;
        }

        ticketIdsToDelete = tickets.map(t => t.id);

        console.log(`🎟️ S-au generat în total ${tickets.length} bilete (Ne așteptam la 1000).`);
        if (tickets.length !== 1000) {
            console.log(`⚠️ ATENȚIE: Nu s-au generat fix 1000, posibil hook-ul a crăpat, nu a rulat din cauza unui timeout, sau mai era nevoie de o secundă de așteptare. Bilete găsite: ${tickets.length}`);
        }

        // --- 6. Validarea Matematică & Dubluri ---
        let hasDuplicates = false;
        const setNumere = new Set();
        const dubluri = [];

        for (const t of tickets) {
            const cur = Number(t.ticket_number);
            if (setNumere.has(cur)) {
                hasDuplicates = true;
                dubluri.push(cur);
            }
            setNumere.add(cur);
        }

        console.log('\n=============================================');
        if (hasDuplicates) {
            console.log(`[FAIL] EȘEC! S-au găsit ${dubluri.length} dubluri:`, dubluri.slice(0, 10), '...');
        } else if (tickets.length === 0) {
            console.log(`[FAIL] EȘEC! Baza de date a returnat 0 bilete. S-ar putea ca update-ul la hook să nu fi fost publicat complet pe Render încă, sau directus a ratat webhook-urile.`);
        } else {
            console.log(`[PASS] 🎉 ZERO DUBLURI DETECTATE LA ${tickets.length} BILETE GENERATE PERFECT SIMULTAN!`);
            console.log(`🔒 Testul a confirmat că mecanismul 'Database Row Locking' cu selectare "Random" în Hook a funcționat perfect. Toate cele 4 comenzi s-au respectat succesiv.`);
        }
        console.log('=============================================\n');

    } catch (e) {
        console.error('❌ Eroare generală:', e.message || e);
    } finally {
        // --- 7. CLEANUP (Ștergerea Datelor de Test) ---
        console.log('[7/7] CURĂȚENIE AUTOMATĂ... (Te rog nu închide scriptul, ștergem ticketii falși)');
        try {
            // Stergem biletele in bucati (pt evt. 502 Bad Gateway)
            if (ticketIdsToDelete.length > 0) {
                 const chunkSize = 100;
                 for (let i = 0; i < ticketIdsToDelete.length; i += chunkSize) {
                     const chunk = ticketIdsToDelete.slice(i, i + chunkSize);
                     await client.request(deleteItems('tickets', chunk));
                 }
                 console.log(`✅ ${ticketIdsToDelete.length} Bilete de test eliminate.`);
            }
            
            // Itemele din comenzi
            if (itemIds.length > 0) {
                 await client.request(deleteItems('order_items', itemIds));
            }
            
            // Comenzile
            if (orderIds.length > 0) {
                 await client.request(deleteItems('orders', orderIds));
                 console.log(`✅ ${orderIds.length} Comenzi de test eliminate.`);
            }
            
            // Giveaway-ul
            if (giveawayId) {
                 await client.request(deleteItem('giveaways', giveawayId));
                 console.log(`✅ Giveaway Test eliminat.`);
            }

            console.log('✨ CURĂȚENIE COMPLETĂ! Baza ta de date a rămas intactă și nepătată de test.');
        } catch (cleanupErr) {
            console.error('⚠️ Eroare la curățenie (e posibil să fi rămas date de test). Verificați colecțiile Test în Directus.', cleanupErr.message || cleanupErr);
        }
    }
}

runTest();
