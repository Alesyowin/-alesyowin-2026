export default ({ filter }, { services }) => {
    console.log('[bonus-draws-engine] Hook automat (FILTER) pentru Bonus Draws încărcat cu succes.');

    filter('giveaways.items.update', async (payload, meta, context) => {
        // Verificăm dacă sold_tickets a fost actualizat
        const soldTicketsKey = Object.keys(payload).find(k => k.toLowerCase() === 'sold_tickets');
        if (!soldTicketsKey) return payload; 

        const soldTicketsValue = Number(payload[soldTicketsKey]);
        if (isNaN(soldTicketsValue)) return payload;

        const knex = context.database; // Aici va fi chiar tranzacția dacă vine din ticket-engine!

        for (const giveawayId of meta.keys) {
            try {
                // Citim direct Giveaway-ul folosind knex-ul curent
                const giveaway = await knex('giveaways').where({ id: giveawayId }).first();
                if (!giveaway) continue;

                const totalTickets = Number(giveaway.total_tickets) || 0;
                
                // Evităm parse erori
                let rawBonus = payload.bonus_draws || giveaway.bonus_draws;
                let bonusDraws = [];
                if (typeof rawBonus === 'string') {
                    try { bonusDraws = JSON.parse(rawBonus); } catch (e) { bonusDraws = []; }
                } else if (Array.isArray(rawBonus)) {
                    bonusDraws = rawBonus;
                }
                
                if (!bonusDraws || bonusDraws.length === 0 || totalTickets === 0) {
                    continue; // Niciun bonus_draw configurat
                }

                const currentSoldTickets = soldTicketsValue;
                const percentage = (currentSoldTickets / totalTickets) * 100;
                
                let updated = false;
                const updatedBonusDraws = [...bonusDraws];

                // Verificăm pragurile depășite
                for (let i = 0; i < updatedBonusDraws.length; i++) {
                    const draw = updatedBonusDraws[i];
                    
                    if (Number(draw.percentage) <= percentage && draw.is_won !== true) {
                        
                        console.log(`[bonus-draws-engine] Giveaway ${giveawayId} a atins pragul de ${draw.percentage}%. Extragere aleatorie...`);

                        // Extragem biletele vândute din tranzacția curentă
                        const assignedRows = await knex('tickets')
                            .where({ giveaway_id: giveawayId })
                            .select('ticket_number', 'client_name', 'email', 'order_id');
                        
                        if (assignedRows.length === 0) {
                            console.warn(`[bonus-draws-engine] Atenție, niciun bilet generat pe giveaway ${giveawayId}. Extragere amânată.`);
                            continue;
                        }

                        // Selectează câștigător random
                        const randomIndex = Math.floor(Math.random() * assignedRows.length);
                        const winningTicket = assignedRows[randomIndex];

                        const winnerName = winningTicket.client_name || winningTicket.email?.split('@')[0] || 'Anonim';

                        updatedBonusDraws[i] = {
                            ...draw,
                            is_won: true,
                            winner_name: winnerName,
                            winner_ticket: winningTicket.ticket_number
                        };
                        
                        updated = true;
                        console.log(`[bonus-draws-engine] 🎉 BONUS DRAW CÂȘTIGAT (${draw.percentage}%)! Extras: ${winningTicket.ticket_number} -> ${winnerName}`);
                    }
                }

                if (updated) {
                    // Punem noile bonus draws direct în payload-ul care urmează să se salveze în baza de date
                    payload.bonus_draws = JSON.stringify(updatedBonusDraws);
                }

            } catch (err) {
                console.error('[bonus-draws-engine] Eroare severă procesând un bonus draw', giveawayId, err?.message || err);
            }
        }
        
        return payload;
    });
};
