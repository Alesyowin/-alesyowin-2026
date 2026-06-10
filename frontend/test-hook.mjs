import fetch from 'node-fetch';

async function testHook() {
    const token = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';
    try {
        console.log("Triggering Webhook for Order 23...");
        const resOrder = await fetch('https://gpcompetition.onrender.com/items/orders/23', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'paid'
            })
        });
        const orderData = await resOrder.json();
        console.log("UPDATED ORDER:", orderData);

    } catch (err) {
        console.error("Fetch err:", err);
    }
}
testHook();
