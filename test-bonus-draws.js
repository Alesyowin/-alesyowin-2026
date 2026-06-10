const DIRECTUS_URL = "https://gpcompetition.onrender.com";
const BEARER_TOKEN = "Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE";

async function appFetch(endpoint, method, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (BEARER_TOKEN) headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DIRECTUS_URL}${endpoint}`, options);
    return res.json();
}

async function runBonusDrawsTest() {
    console.log("\n🚀 Pornim Testul Automatizat pentru Motorul Bonus Draws...\n");

    try {
        // 1. Creare Giveaway test
        console.log("⏳ 1. Creare Concurs test (10 bilete cu praguri Bonus Draws 30%, 60%, 90%)...");
        
        const instantPrizes = [
            { "ticket_number": 2, "prize_amount": 50, "prize_currency": "GBP", "is_won": false }
        ];

        const bonusDraws = [
            { "percentage": 30, "prize_amount": 100, "prize_currency": "GBP", "is_won": false },
            { "percentage": 60, "prize_amount": 200, "prize_currency": "GBP", "is_won": false },
            { "percentage": 90, "prize_amount": 300, "prize_currency": "GBP", "is_won": false },
            { "percentage": 100, "prize_amount": 1000, "prize_currency": "GBP", "is_won": false }
        ];

        const giveaway = await appFetch("/items/giveaways", "POST", { 
            title: "Test Bonus Draws Automated", 
            total_tickets: 10,
            sold_tickets: 0,
            bonus_draws: bonusDraws,
            instant_prizes: instantPrizes
        });
        
        if (!giveaway.data) {
            console.error(giveaway);
            throw new Error("Nu am putut crea concursul.");
        }
        
        const gId = giveaway.data.id;
        console.log(`✅ Concurs creat cu ID-ul: ${gId}\n`);

        // Funcție helper pentru simularea vânzărilor
        async function vindeBilete(qty, faza) {
            console.log(`⏳ [Faza ${faza}] Creare comandă pentru ${qty} bilete...`);
            
            const order = await appFetch("/items/orders", "POST", {
                client_email: `test_bonus_${faza}@gpcompetition.ro`,
                customer_name: `Client Faza ${faza}`,
                status: "pending"
            });
            const oId = order.data.id;

            await appFetch("/items/order_items", "POST", {
                order_id: oId,
                giveaway_id: gId,
                quantity: qty
            });

            console.log(`🔔 Simulare plată (declanșare ticket-engine care apoi declanșează bonus-draws-engine)...`);
            await appFetch(`/items/orders/${oId}`, "PATCH", { status: "paid" });

            console.log("⏳ Aștept 4 secunde ca ambele motoare să termine procesarea...");
            await new Promise(r => setTimeout(r, 4000));

            // Extrag starea nouă a concursului
            const updated = await appFetch(`/items/giveaways/${gId}`, "GET");
            return updated.data;
        }

        // Faza A: 3 bilete -> atinge 30%
        let currentGiveaway = await vindeBilete(3, "A (30%)");
        console.log(`[Status DB] Vândute: ${currentGiveaway.sold_tickets} / 10`);
        let currentBonusDraws = currentGiveaway.bonus_draws || [];
        console.log(currentBonusDraws.map(d => `${d.percentage}% -> is_won: ${d.is_won} (${d.winner_name || ''})`).join('\n'));
        console.log("------------------------------------------------\n");

        // Faza B: +3 bilete (total 6) -> atinge 60%
        currentGiveaway = await vindeBilete(3, "B (60%)");
        console.log(`[Status DB] Vândute: ${currentGiveaway.sold_tickets} / 10`);
        currentBonusDraws = currentGiveaway.bonus_draws || [];
        console.log(currentBonusDraws.map(d => `${d.percentage}% -> is_won: ${d.is_won} (${d.winner_name || ''})`).join('\n'));
        console.log("------------------------------------------------\n");

        // Faza C: +3 bilete (total 9) -> atinge 90%
        currentGiveaway = await vindeBilete(3, "C (90%)");
        console.log(`[Status DB] Vândute: ${currentGiveaway.sold_tickets} / 10`);
        currentBonusDraws = currentGiveaway.bonus_draws || [];
        console.log(currentBonusDraws.map(d => `${d.percentage}% -> is_won: ${d.is_won} (${d.winner_ticket || ''} - ${d.winner_name || ''})`).join('\n'));
        console.log("------------------------------------------------\n");

        console.log("🔍 Validare Finală Instant Prizes:");
        const ip = currentGiveaway.instant_prizes || [];
        console.log(ip.map(p => `Bilet ${p.ticket_number} -> is_won: ${p.is_won} (${p.winner_name || ''})`).join('\n'));

        // Delete test giveaway (optional, dar să păstrăm DB curat)
        // await appFetch(`/items/giveaways/${gId}`, "DELETE");

        console.log("\n🎉 TEST FINALIZAT.");

    } catch (e) {
        console.error("❌ Eroare la rularea testului:", e);
    }
}

runBonusDrawsTest();
