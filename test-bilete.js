// AICI TREBUIE SĂ PUI LINK-UL CĂTRE NOUL TĂU SERVER DIRECTUS (cel cu https://...)
const DIRECTUS_URL = "https://gpcompetition.onrender.com";

const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA4YzYyZWYxLWVmZTQtNGI4Zi1iZDJlLTdkNTIxMWFlN2JkNSIsInJvbGUiOiIxMWM2YzI0OC0wNjVkLTRkN2YtODUyZi1kYWU4NGE0OTY5YzAiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc3MjkwNjc1MiwiZXhwIjoxNzcyOTA3NjUyLCJpc3MiOiJkaXJlY3R1cyJ9.O_dHHgBJPBitcqKy_ny4gHuvh3GMAUbmsIRQjnOcl1Q";

async function appFetch(endpoint, method, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (BEARER_TOKEN) headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DIRECTUS_URL}${endpoint}`, options);
    return res.json();
}

async function runTicketEngineTest() {
    console.log("🚀 Pornim Testul Automatizat pentru Motorul de Bilete...\n");

    if (DIRECTUS_URL === "PUNE_AICI_LINKUL_TAU_DIRECTUS") {
        console.log("❌ Eroare: Ai uitat să pui link-ul de la Directus sus în script!");
        return;
    }

    try {
        // 1. Creare Setup
        console.log("⏳ 1. Se creează Concursul de test (50 de bilete maxim)...");
        const giveaway = await appFetch("/items/giveaways", "POST", { title: "Test Automat", total_tickets: 50 });
        if (!giveaway.data) throw new Error("Nu am putut crea concursul. Verifică dacă ai activat permisiunile de Creare (+).");

        // 2. Comanda Inițială
        console.log("⏳ 2. Se creează Comanda (status: pending)...");
        const order = await appFetch("/items/orders", "POST", {
            client_email: "test.automat@gpcompetition.ro",
            status: "pending"
        });
        if (!order.data) throw new Error("Nu am putut crea comanda.");

        // 3. Adăugare Coș Cumpărături
        console.log("⏳ 3. Se adaugă 3 bilete în coșul clientului...");
        await appFetch("/items/order_items", "POST", {
            order_id: order.data.id,
            giveaway_id: giveaway.data.id,
            quantity: 3
        });

        // 4. DECLANȘATORUL MAGIC (Webhook Simulat)
        console.log("🔔 4. [SIMULARE PLATĂ] Schimbăm statusul comenzii în 'paid'...");
        await appFetch(`/items/orders/${order.data.id}`, "PATCH", { status: "paid" });

        console.log("⏳ Așteptăm 2 secunde pentru ca motorul să extragă numerele...\n");
        await new Promise(r => setTimeout(r, 2000));

        // 5. Validare finală
        const checkTickets = await appFetch(`/items/tickets?filter[order_id][_eq]=${order.data.id}`, "GET");

        console.log("------------------------------------------------");
        if (checkTickets.data && checkTickets.data.length === 3) {
            console.log(`🏆 [PASS] SUCCES ABSOLUT! Motorul a generat instantaneu ${checkTickets.data.length} bilete.`);
            console.log(`🎟️ Numerele extrase random: ${checkTickets.data.map(t => t.ticket_number).join(", ")}`);
        } else {
            console.log(`❌ [FAIL] Eroare! Ne așteptam la 3 bilete, dar am găsit: ${checkTickets?.data?.length || 0}`);
            console.log("👉 Sfat: Verifică în Directus la Access Policies -> Public dacă ai bifat + (Create) și Creionul (Update) pentru colecțiile orders, order_items, giveaways și tickets.");
        }
        console.log("------------------------------------------------");

    } catch (e) {
        console.log("❌ Eroare la rularea testului:", e.message);
    }
}

runTicketEngineTest();