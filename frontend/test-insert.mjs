async function testInsert() {
    const token = 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE';
    try {
        // Try creating an order with specific casings
        const resOrder = await fetch('https://gpcompetition.onrender.com/items/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'pending',
                Client_Email: 'testcase@gmail.com',
                client_email: 'testcase@gmail.com', // Try both
                Product_ID: 17,
                product_id: 17,
                Quantity: 2,
                quantity: 2
            })
        });
        const orderData = await resOrder.json();
        console.log("CREATED ORDER:", orderData);

        const orderId = orderData.data.id;

        // Try creating an order item
        const resOrderItem = await fetch('https://gpcompetition.onrender.com/items/order_items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                order_id: orderId,
                giveaway_id: 17,
                Giveaway_ID: 17, // Try both
                quantity: 2,
                Quantity: 2
            })
        });
        const orderItemData = await resOrderItem.json();
        console.log("CREATED ORDER ITEM:", orderItemData);

    } catch (err) {
        console.error("Fetch err:", err);
    }
}
testInsert();
