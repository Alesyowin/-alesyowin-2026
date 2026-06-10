export default ({ action }, { services }) => {
    const { ItemsService } = services;
    console.log('[ticket-engine] Hook cu generare RANDOM și Locking înregistrat cu succes');

    action('items.update', async (meta, context) => {
        // Rulăm doar la actualizări pe colecția 'orders'
        if (String(meta.collection).toLowerCase() !== 'orders') return;

        const payload = meta.payload || {};
        const statusKey = Object.keys(payload).find(k => k.toLowerCase() === 'status');
        if (!statusKey) return;

        const statusValue = String(payload[statusKey]).toLowerCase().trim();
        if (statusValue !== 'paid') return;

        // Baza de date (Knex) pentru Tranzacții/Locking
        const knex = context.database;
        const schema = context.schema;

        const ordersService = new ItemsService('orders', { schema: context.schema, accountability: context.accountability });
        const itemsService  = new ItemsService('order_items', { schema: context.schema, accountability: context.accountability });

        for (const orderId of meta.keys) {
            try {
                // Pas 1 & 2: Citim comanda completă
                const order = await ordersService.readOne(orderId);
                const emailKey = Object.keys(order).find(k => k.toLowerCase().includes('email'));
                const email = emailKey ? order[emailKey] : 'necunoscut@gp.ro';
                const clientName = order.customer_name || order.client_name || email;

                // Pas 3: Citim item-urile comenzii din DB
                const items = await itemsService.readByQuery({ filter: { order_id: { _eq: orderId } } });
                if (!items || items.length === 0) {
                    console.warn(`[ticket-engine] Niciun order_item găsit pentru comanda ${orderId}`);
                    continue;
                }

                // Generăm biletele pentru VIRTUAL FIECARE ITEM într-o singură tranzacție de baze de date cu izolare absolută
                await knex.transaction(async (trx) => {
                    // Verificăm dacă are deja bilete această comandă (Evitare dublură totală în event queue)
                    const existingTicketsCheck = await trx('tickets').where({ order_id: orderId }).select('id').limit(1);
                    if (existingTicketsCheck.length > 0) {
                        console.log(`[ticket-engine] ⚠️ Biletele pentru comanda ${orderId} există deja. Ignorare tranzacție.`);
                        return; // Oprim doar această tranzacție, trecem la alt order
                    }

                    for (const item of items) {
                        const gId = item.giveaway_id || item.Giveaway_ID;
                        const qty = item.quantity || item.Quantity || 1;

                        if (!gId) continue;

                        // SECREȚIA ALGORITMICĂ:
                        // "forUpdate()" blochează complet rândul de giveaway în DB până când se termină calculele noastre,
                        // restul clienților concurenți vor aștepta cuminți.
                        const giveawayData = await trx('giveaways').where({ id: gId }).forUpdate().first();
                        
                        // Dacă giveaway-ul nu există sau are probleme, ignorăm
                        const totalTickets = giveawayData?.total_tickets || 0;
                        if (!giveawayData || totalTickets === 0) {
                            console.warn(`[ticket-engine] Giveaway lipsă sau invalid (${gId}). Total tickets necunoscut.`);
                            continue; 
                        }

                        // Extragerea completă a numerelor deja vândute / alocate la acest giveaway
                        const assignedRows = await trx('tickets').where({ giveaway_id: gId }).select('ticket_number');
                        const assignedSet = new Set(assignedRows.map(row => Number(row.ticket_number)));

                        if (assignedSet.size + qty > totalTickets) {
                            console.warn(`[ticket-engine] Nu sunt destule bilete libere în giveaway ${gId}. (Cerute: ${qty}, Libere: ${totalTickets - assignedSet.size})`);
                            continue; // Nici măcar nu încercăm să blocăm sistemul dacă nu mai sunt bilete. (Sau am putea restrânge qty)
                        }

                        console.log(`[ticket-engine] Giveaway ${gId} BLOCAT în Tranzacție. Căutăm ${qty} numere libere RANDOM (Total: ${totalTickets}, Vândute deja: ${assignedSet.size})...`);

                        const newTicketNumbers = [];
                        
                        // Generare algoritm RANDOM garantat FĂRĂ dubluri
                        while (newTicketNumbers.length < qty) {
                            // Generează număr de la 1 la total_tickets
                            const randomNum = Math.floor(Math.random() * totalTickets) + 1;
                            
                            if (!assignedSet.has(randomNum)) {
                                assignedSet.add(randomNum); // Adăugăm în set și local ca să nu apară dubluri nici pe același client
                                newTicketNumbers.push(randomNum);
                            }
                        }

                        console.log(`[ticket-engine] Numere alocate pt order ${orderId}: ${newTicketNumbers.join(', ')}`);

                        // Crează Service-urile pentru a folosi motorul intern Directus în interiorul tranzacției (garantează compatibilitatea cu JSON strigify/SQLite/Postgres)
                        const localTicketsService = new ItemsService('tickets', { schema: context.schema, knex: trx, accountability: context.accountability });
                        const localGiveawaysService = new ItemsService('giveaways', { schema: context.schema, knex: trx, accountability: context.accountability });

                        // Formăm datele pentru bilete
                        const ticketsToInsert = newTicketNumbers.map(ticketNum => ({
                            ticket_number: ticketNum,
                            order_id: Number(orderId), // Siguranță
                            giveaway_id: Number(gId),
                            email: email,
                            client_name: clientName,
                            // date_created e autocompletat de Directus Data Service
                            is_winner: false,
                        }));

                        // Inserăm biletele prin Serviciul Directus pentru validări interne auto-cast
                        if (ticketsToInsert.length > 0) {
                            await localTicketsService.createMany(ticketsToInsert);
                        }

                        // Actualizăm contoarele vizuale ale giveaway-ului
                        const finalSold = assignedSet.size; 
                        const finalLeft = Math.max(0, totalTickets - finalSold);
                        const updateData = {
                            sold_tickets: finalSold,
                            tickets_left: finalLeft
                        };

                        // === INSTANT WIN ===
                        let hasInstantWin = false;
                        if (giveawayData.instant_prizes) {
                            let prizes = [];
                            try {
                                prizes = typeof giveawayData.instant_prizes === 'string'
                                    ? JSON.parse(giveawayData.instant_prizes)
                                    : giveawayData.instant_prizes;
                            } catch (e) { prizes = []; }

                            if (Array.isArray(prizes)) {
                                const newTicketSetObj = new Set(newTicketNumbers.map(n => Number(n)));
                                
                                const updatedPrizes = prizes.map(prize => {
                                    if (!prize.is_won && newTicketSetObj.has(Number(prize.ticket_number))) {
                                        console.log(`[ticket-engine] 🎉 INSTANT WIN! Bilet RANDOM extras: ${prize.ticket_number} (${prize.prize_amount} ${prize.prize_currency}) -> Câștigător: ${clientName}`);
                                        hasInstantWin = true;
                                        return { ...prize, is_won: true, winner_name: clientName };
                                    }
                                    return prize;
                                });

                                if (hasInstantWin) {
                                    // Setăm obiectul/array-ul direct! ItemsService va ști cum să îl stringifice pe Postgres/SQLite exact conform schemei tale setate din Admin
                                    updateData.instant_prizes = updatedPrizes;
                                }
                            }
                        }

                        // Trimitem UPDATE în baza de date
                        await localGiveawaysService.updateOne(gId, updateData);
                        console.log(`[ticket-engine] Giveaway ${gId} Actualizat & ELIBERAT. Vândute-Acum: ${finalSold}`);
                    }
                });

            } catch (err) {
                console.error('[ticket-engine] Eroare la procesarea comenzii', orderId, err?.message || err);
                throw err;
            }
        }
    });
};
