(async () => {
    try {
        const response = await fetch('http://localhost:3000/api/webhook/bonus-winner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: 'Q5Rn66dcpUUEmaDNmYG71se95RI5QhYE', // DIRECTUS_ADMIN_TOKEN real
                orderId: 'test-123',
                giveawayId: '12',
                giveawayTitle: 'Bmw m4 COMPETITION + Bonus Draws',
                ticketNumber: '3',
                winnerName: 'Albert NBN',
                winnerEmail: 'vultureanu_adrian@yahoo.com', 
                winnerPhone: '+40123456789',
                locale: 'en', // testam engleza cum e site-ul lui in poza
                prizeValue: '250 £',
                threshold: '10'
            })
        });
        
        const data = await response.json();
        console.log('Test result:', data);
    } catch (e) {
        console.log('Error:', e);
    }
})();
