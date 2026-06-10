const DIRECTUS_URL = "https://gpcompetition.onrender.com";
const BEARER_TOKEN = "Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE";

async function appFetch(endpoint, method, body = null) {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DIRECTUS_URL}${endpoint}`, options);
    return res.json();
}

async function testHook() {
    console.log("Creare Giveaway test...");
    const bonusDraws = [
        { "percentage": 50, "prize_amount": 100, "prize_currency": "GBP", "is_won": false }
    ];
    let g = await appFetch("/items/giveaways", "POST", { 
        title: "Test Hook Direct", 
        total_tickets: 10,
        sold_tickets: 0,
        bonus_draws: bonusDraws
    });
    
    let gId = g.data.id;
    console.log("Giveaway creat:", gId);

    console.log("Adaugare 5 bilete manual...");
    await appFetch("/items/tickets", "POST", [
        { giveaway_id: gId, ticket_number: 1, email: "a@a.com" },
        { giveaway_id: gId, ticket_number: 2, email: "b@b.com" }
    ]);

    console.log("Update sold_tickets direct...");
    await appFetch(`/items/giveaways/${gId}`, "PATCH", { sold_tickets: 5 });

    console.log("Wait...");
    await new Promise(r => setTimeout(r, 2000));
    
    let updated = await appFetch(`/items/giveaways/${gId}`, "GET");
    console.log("Rezultat:", JSON.stringify(updated.data.bonus_draws));
}
testHook();
