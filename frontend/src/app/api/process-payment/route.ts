import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createDirectus, rest, readItems, updateItem, staticToken } from '@directus/sdk';
import { getTranslations } from 'next-intl/server';
import { sendOrderConfirmationEmail, sendAdminOrderNotification, sendInstantWinnerEmail, sendAdminInstantWinnerEmail, sendBonusWinnerEmail, sendAdminBonusWinnerEmail } from '../../../lib/email';

// Configurare Directus
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const NMI_PRIVATE_KEY = process.env.NMI_PRIVATE_KEY;
const PAYTRIOT_MERCHANT_ID = process.env.PAYTRIOT_MERCHANT_ID || '';
const PAYTRIOT_SECURITY_KEY = process.env.PAYTRIOT_SECURITY_KEY || '';

// Client admin Directus
const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

/**
 * Endpoint care procesează plata prin NMI (Paytriot) folosind un payment_token
 * de la Collect.js. Fluxul:
 * 1. Validare date de intrare
 * 2. Verificare comandă în Directus  
 * 3. Trimitere cerere de plată la NMI (transact.php)
 * 4. Dacă plata e aprobată → marchează comanda ca "paid", generează bilete, trimite email
 * 5. Returnează rezultatul la client
 */
export async function POST(request: Request) {
    // Blocare în producție — ruta veche NMI nu mai este folosită
    if (process.env.NODE_ENV === 'production') {
        return new Response(null, { status: 404 });
    }

    try {
        // Verificare chei configurate
        if (!NMI_PRIVATE_KEY) {
            console.error('[PAYMENT] Lipsește NMI_PRIVATE_KEY din variabilele de mediu');
            return NextResponse.json(
                { error: 'Payment gateway not configured' },
                { status: 500 }
            );
        }

        if (!ADMIN_TOKEN || ADMIN_TOKEN === 'ADAUGA_TOKEN_AICI') {
            return NextResponse.json(
                { error: 'Missing Server Admin Token' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { orderId, paymentToken, amount } = body;

        // Validare date primite
        if (!orderId || !paymentToken || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, paymentToken, amount' },
                { status: 400 }
            );
        }

        console.log(`[PAYMENT] Procesare plată NMI pentru Order #${orderId}, Total: £${amount}`);

        // --- PASUL 1: Trimitere cerere la NMI Gateway (LIVE Paytriot) ---
        // Generăm un REFID unic per încercare (orderId + timestamp) ca să evităm eroarea "Duplicate transaction"
        const uniqueRefId = `${orderId}-${Date.now()}`;

        // Câmpurile tranzacției — include statementNarrative1 și statementNarrative2 pentru extrasul bancar
        // PAYTRIOT_SECURITY_KEY (merchantSecret) nu intră în obiect — se concatenează direct la semnătură
        const transactionFields: Record<string, string> = {
            'merchantID': PAYTRIOT_MERCHANT_ID,
            'type': 'sale',
            'amount': String(amount),
            'payment_token': paymentToken,
            'currency': 'GBP',
            'orderid': uniqueRefId,
            'statementNarrative1': 'Paytrio*Ukcomp',
            'statementNarrative2': '02038841611',
        };

        // === Calcul semnătură SHA-512 ===
        // Sortăm câmpurile alfabetic, construim un query-string URL-encoded,
        // apoi concatenăm cheia secretă la final și aplicăm SHA-512
        const sortedKeys = Object.keys(transactionFields).sort();
        const sortedPairs = sortedKeys.map(key => 
            `${encodeURIComponent(key)}=${encodeURIComponent(transactionFields[key])}`
        );
        const signatureString = sortedPairs.join('&');
        const signature = crypto
            .createHash('sha512')
            .update(signatureString + PAYTRIOT_SECURITY_KEY)
            .digest('hex');

        // Adăugăm semnătura la câmpurile tranzacției
        transactionFields['signature'] = signature;

        const nmiParams = new URLSearchParams(transactionFields);

        console.log(`[PAYMENT] Semnătură SHA-512 calculată, se trimite la gateway LIVE...`);

        // Către gateway-ul LIVE Paytriot
        const nmiResponse = await fetch('https://gateway.paytriot.co.uk/direct/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: nmiParams.toString(),
        });

        const nmiText = await nmiResponse.text();
        
        // Parsăm răspunsul NMI (format query-string: response=1&responsetext=SUCCESS&...)
        const nmiResult = Object.fromEntries(new URLSearchParams(nmiText));
        
        console.log(`[PAYMENT] NMI Response: response=${nmiResult.response}, text=${nmiResult.responsetext}, txn=${nmiResult.transactionid}`);

        // --- PASUL 2: Verificare rezultat plată ---
        if (nmiResult.response !== '1') {
            // Plata a fost refuzată sau a apărut o eroare
            const errorMessage = nmiResult.responsetext || 'Payment declined';
            console.warn(`[PAYMENT] ❌ Plată refuzată pentru Order #${orderId}: ${errorMessage}`);
            return NextResponse.json(
                { 
                    error: errorMessage, 
                    declined: nmiResult.response === '2',
                    responseCode: nmiResult.response_code 
                },
                { status: 402 }
            );
        }

        // --- PASUL 3: Plata e aprobată → Marcăm comanda ca PAID ---
        console.log(`[PAYMENT] ✅ Plata aprobată! TXN: ${nmiResult.transactionid}, Auth: ${nmiResult.authcode}`);

        try {
            await adminClient.request(
                updateItem('orders', orderId.toString(), {
                    status: 'paid',
                })
            );
            console.log(`[PAYMENT] Order #${orderId} marcat ca PAID`);
        } catch (updateErr: any) {
            console.error(`[PAYMENT] Eroare critică la actualizare status:`, updateErr?.message);
            // Plata a fost luată, dar nu putem actualiza — log pentru rezolvare manuală
            return NextResponse.json({
                error: 'Payment was successful but order update failed. Contact support.',
                transactionId: nmiResult.transactionid
            }, { status: 500 });
        }

        // --- PASUL 4: Așteptare generare bilete (hook Directus) ---
        console.log(`[PAYMENT] Așteptăm 3s pentru generarea biletelor...`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        // --- PASUL 5: Colectare date pentru email ---
        try {
            // @ts-ignore
            const order = await adminClient.request(
                readItems('orders' as any, {
                    filter: { id: { _eq: parseInt(orderId, 10) } },
                    fields: ['id', 'client_email', 'client_phone', 'customer_name', 'Total_Amount', 'locale'] as any,
                    limit: 1,
                })
            );

            const orderData = order?.[0];
            if (!orderData) {
                console.error(`[PAYMENT] Comanda #${orderId} NU a fost găsită după plată!`);
                return NextResponse.json({
                    success: true,
                    orderId,
                    transactionId: nmiResult.transactionid,
                    message: 'Payment successful (email may be delayed)'
                });
            }

            const orderLocale = orderData.locale || 'en';
            const customerName = orderData.customer_name || orderData.client_email || 'Customer';
            const customerPhone = orderData.client_phone || 'Nespecificat';

            // Citim biletele generate
            // @ts-ignore
            const tickets = await adminClient.request(
                readItems('tickets' as any, {
                    filter: { order_id: { _eq: parseInt(orderId, 10) } },
                    fields: ['ticket_number', 'giveaway_id'] as any,
                    limit: 500,
                })
            );

            console.log(`[PAYMENT] Găsite ${tickets.length} bilete pentru Order #${orderId}`);

            // Construim produsele pentru template-ul de email
            const productsMap = new Map<number, { giveawayTitle: string; productImageUrl?: string; tickets: string[] }>();
            const giveawayIds = Array.from(new Set(tickets.map((t: any) => t.giveaway_id)));

            // Citim order_items cu date detaliate (cantitate, preț) pentru emailul admin
            let orderItemsData: any[] = [];
            try {
                // @ts-ignore
                orderItemsData = await adminClient.request(
                    readItems('order_items' as any, {
                        filter: { order_id: { _eq: parseInt(orderId, 10) } },
                        fields: ['giveaway_id', 'quantity', 'unit_price', 'line_total', 'Quantity'] as any
                    })
                );
            } catch (oiErr) {
                console.warn('[PAYMENT] Nu am putut citi order_items detaliat:', oiErr);
            }

            if (giveawayIds.length > 0) {
                // @ts-ignore
                const giveaways = await adminClient.request(
                    readItems('giveaways' as any, {
                        filter: { id: { _in: giveawayIds } },
                        fields: ['id', 'title', 'image', 'price', 'instant_prizes', 'bonus_draws', 'translations.languages_code', 'translations.title'] as any,
                    })
                );

                const host = request.headers.get('host') || 'gpcompetition.com';
                const protocol = host.includes('localhost') ? 'http' : 'https';
                const actualBaseUrl = (host.includes('localhost') || host.includes('127.0.0.1'))
                    ? 'https://gpcompetition.com'
                    : `${protocol}://${host}`;

                giveaways.forEach((g: any) => {
                    let finalTitle = g.title;

                    if (g.translations && Array.isArray(g.translations)) {
                        let match = g.translations.find((t: any) => t.languages_code === orderLocale);
                        if (!match || !match.title) {
                            match = g.translations.find((t: any) => t.languages_code === 'en');
                        }
                        if (!match || !match.title) {
                            match = g.translations.find((t: any) => !!t.title);
                        }
                        if (match && match.title) {
                            finalTitle = match.title;
                        }
                    }

                    productsMap.set(g.id, {
                        giveawayTitle: finalTitle || 'Competition Entry',
                        productImageUrl: g.image ? `${actualBaseUrl}/api/asset/${g.image}?width=600` : undefined,
                        tickets: [],
                        unitPrice: g.price || 0,
                        instantPrizes: g.instant_prizes,
                        bonusDraws: g.bonus_draws
                    } as any);
                });
            }

            tickets.forEach((t: any) => {
                const prod = productsMap.get(t.giveaway_id);
                if (prod) prod.tickets.push(t.ticket_number);
            });

            // Trimitere email de confirmare
            const host = request.headers.get('host') || 'gpcompetition.com';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const baseUrl = `${protocol}://${host}`;
            const t = await getTranslations({ locale: orderLocale, namespace: 'OrderEmail' });

            const emailResult = await sendOrderConfirmationEmail({
                to: orderData.client_email,
                customerName,
                orderId: orderId.toString(),
                totalAmount: orderData.Total_Amount ? orderData.Total_Amount.toString() : '0',
                products: Array.from(productsMap.values()).filter(p => p.tickets.length > 0),
                locale: orderLocale,
                translations: t,
                baseUrl,
            });

            if (!emailResult.success) {
                console.warn(`[PAYMENT] ⚠️ Email-ul NU a putut fi trimis:`, emailResult.error);
            } else {
                console.log(`[PAYMENT] ✅ Email trimis cu succes la ${orderData.client_email}`);
            }

            // Trimitere email notificare admin (independent de emailul client)
            try {
                console.log(`[PAYMENT] Sending admin notification email...`);

                let adminProducts: any[] = [];
                
                if (orderItemsData && orderItemsData.length > 0) {
                    adminProducts = orderItemsData.map((item: any) => {
                        const gId = item.giveaway_id;
                        const productInfo = productsMap.get(gId);
                        const qty = item.quantity || item.Quantity || 1;
                        const unitPrice = item.unit_price || (productInfo as any)?.unitPrice || 0;
                        const lineTotal = item.line_total || (unitPrice * qty);

                        return {
                            title: productInfo?.giveawayTitle || 'Competition Ticket',
                            imageUrl: productInfo?.productImageUrl,
                            quantity: qty,
                            unitPrice: Number(unitPrice),
                            lineTotal: Number(lineTotal),
                        };
                    });
                } else if (productsMap.size > 0) {
                    adminProducts = Array.from(productsMap.entries()).map(([gId, info]: [number, any]) => {
                        const qty = info.tickets.length || 1;
                        const unitPrice = info.unitPrice || 0;
                        return {
                            title: info.giveawayTitle,
                            imageUrl: info.productImageUrl,
                            quantity: qty,
                            unitPrice: Number(unitPrice),
                            lineTotal: Number(unitPrice * qty)
                        };
                    });
                }

                const adminEmailResult = await sendAdminOrderNotification({
                    orderId: orderId.toString(),
                    customerName,
                    customerEmail: orderData.client_email,
                    products: adminProducts,
                    totalAmount: orderData.Total_Amount ? orderData.Total_Amount.toString() : '0',
                    baseUrl,
                });

                if (!adminEmailResult.success) {
                    console.warn(`[PAYMENT] ⚠️ Admin notification email failed:`, adminEmailResult.error);
                } else {
                    console.log(`[PAYMENT] ✅ Admin notification sent to gpcompetitionn@gmail.com`);
                }
            } catch (adminErr: any) {
                console.warn('[PAYMENT] Admin email error (non-blocking):', adminErr?.message);
            }

            // === PASUL INSTANT WIN: Verificare premii instant ===
            try {
                console.log(`[PAYMENT] Checking for Instant Wins on Order #${orderId}...`);
                const instantWins: { giveawayTitle: string; ticketNumber: any; prizeValue: string }[] = [];
                const tInstant = await getTranslations({ locale: orderLocale, namespace: 'InstantWinnerEmail' });
                
                // Parcurgem toate concursurile cumpărate
                for (const [gwId, info] of Array.from(productsMap.entries())) {
                    const gwInstantPrizes = (info as any).instantPrizes;
                    if (!gwInstantPrizes) continue;
                    
                    let prizesList: any[] = [];
                    if (typeof gwInstantPrizes === 'string') {
                        try { prizesList = JSON.parse(gwInstantPrizes); } catch(e) {}
                    } else if (Array.isArray(gwInstantPrizes)) {
                        prizesList = gwInstantPrizes;
                    }
                    
                    if (prizesList.length === 0) continue;
                    
                    // Convertim biletele clientului la numere pentru comparare corectă
                    const clientTicketsNum = (info.tickets || []).map((t: any) => Number(t));
                    
                    for (const prizeObj of prizesList) {
                        if (clientTicketsNum.includes(Number(prizeObj.ticket_number))) {
                            const val = prizeObj.prize_amount ? `${prizeObj.prize_amount} ${prizeObj.prize_currency || ''}`.trim() : 'Instant Prize';
                            instantWins.push({
                                giveawayTitle: info.giveawayTitle,
                                ticketNumber: prizeObj.ticket_number,
                                prizeValue: val
                            });
                        }
                    }
                }
                
                if (instantWins.length > 0) {
                    console.log(`[PAYMENT] 🎉 Found ${instantWins.length} Instant Win(s)! Sending emails...`);
                    
                    for (const win of instantWins) {
                        // Email Client (Dark Mode + Gold)
                        await sendInstantWinnerEmail({
                            to: orderData.client_email,
                            customerName,
                            ticketNumber: win.ticketNumber,
                            prizeValue: win.prizeValue,
                            giveawayTitle: win.giveawayTitle,
                            translations: tInstant,
                            baseUrl
                        }).catch(e => console.error('[PAYMENT] Error sending Instant Win email to client:', e));
                        
                        // Email Admin
                        await sendAdminInstantWinnerEmail({
                            orderId: orderId.toString(),
                            customerName,
                            customerEmail: orderData.client_email,
                            customerPhone,
                            ticketNumber: win.ticketNumber,
                            prizeValue: win.prizeValue,
                            giveawayTitle: win.giveawayTitle,
                            baseUrl
                        }).catch(e => console.error('[PAYMENT] Error sending Instant Win email to admin:', e));
                    }
                    console.log(`[PAYMENT] ✅ Instant Win emails sent!`);
                } else {
                    console.log(`[PAYMENT] No instant wins for Order #${orderId}.`);
                }
            } catch (instantErr: any) {
                // Nu blocăm fluxul principal
                console.error('[PAYMENT] Error checking Instant Wins (non-blocking):', instantErr?.message);
            }

            // === PASUL BONUS DRAWS: Verificare câștigători bonus ===
            try {
                console.log(`[PAYMENT] Checking for Bonus Draw wins on Order #${orderId}...`);
                const tBonus = await getTranslations({ locale: orderLocale, namespace: 'BonusWinnerEmail' });

                for (const [gwId, info] of Array.from(productsMap.entries())) {
                    const gwBonusDraws = (info as any).bonusDraws;
                    if (!gwBonusDraws) continue;

                    let drawsList: any[] = [];
                    if (typeof gwBonusDraws === 'string') {
                        try { drawsList = JSON.parse(gwBonusDraws); } catch(e) {}
                    } else if (Array.isArray(gwBonusDraws)) {
                        drawsList = gwBonusDraws;
                    }

                    if (drawsList.length === 0) continue;

                    // Căutăm trageri câștigate dar nenotificate
                    const newWins = drawsList.filter((d: any) => d.is_won === true && !d.notified);
                    if (newWins.length === 0) continue;

                    for (const win of newWins) {
                        const winTicketNum = win.winner_ticket;
                        if (!winTicketNum) continue;

                        console.log(`[PAYMENT] 🎉 Bonus Draw Winner found! Ticket #${winTicketNum} for ${win.winner_name}`);

                        // Căutăm datele de contact ale câștigătorului din tabela tickets
                        let winnerEmail = '';
                        let winnerName = win.winner_name || 'Winner';
                        let winnerPhone = 'N/A';
                        let winnerLocale = orderLocale;

                        try {
                            // @ts-ignore
                            const winnerTickets = await adminClient.request(
                                readItems('tickets' as any, {
                                    filter: { giveaway_id: { _eq: gwId }, ticket_number: { _eq: Number(winTicketNum) } },
                                    fields: ['email', 'client_name', 'order_id'] as any,
                                    limit: 1
                                })
                            );

                            if (winnerTickets?.[0]) {
                                winnerEmail = winnerTickets[0].email || '';
                                winnerName = winnerTickets[0].client_name || winnerName;

                                // Preluăm telefonul și locale-ul din comanda câștigătorului
                                if (winnerTickets[0].order_id) {
                                    try {
                                        // @ts-ignore
                                        const winnerOrder = await adminClient.request(
                                            readItems('orders' as any, {
                                                filter: { id: { _eq: winnerTickets[0].order_id } },
                                                fields: ['client_phone', 'locale'] as any,
                                                limit: 1
                                            })
                                        );
                                        if (winnerOrder?.[0]) {
                                            winnerPhone = winnerOrder[0].client_phone || 'N/A';
                                            winnerLocale = winnerOrder[0].locale || orderLocale;
                                        }
                                    } catch (e) { /* ignorăm */ }
                                }
                            }
                        } catch (e) {
                            console.warn('[PAYMENT] Could not look up bonus winner ticket:', e);
                        }

                        if (!winnerEmail) {
                            console.warn(`[PAYMENT] Nu am găsit email-ul pentru biletul câștigător #${winTicketNum}. Trimitem doar la admin.`);
                        }

                        const prizeVal = win.prize_amount ? `${win.prize_amount} ${win.prize_currency || ''}`.trim() : 'Bonus Prize';
                        const tBonusLocale = await getTranslations({ locale: winnerLocale, namespace: 'BonusWinnerEmail' });

                        // Email Client
                        if (winnerEmail) {
                            await sendBonusWinnerEmail({
                                to: winnerEmail,
                                customerName: winnerName,
                                ticketNumber: winTicketNum,
                                prizeValue: prizeVal,
                                giveawayTitle: info.giveawayTitle,
                                translations: tBonusLocale,
                                baseUrl
                            }).catch(e => console.error('[PAYMENT] Error sending Bonus Draw email to client:', e));
                        }

                        // Email Admin
                        await sendAdminBonusWinnerEmail({
                            orderId: orderId.toString(),
                            customerName: winnerName,
                            customerEmail: winnerEmail || 'N/A',
                            customerPhone: winnerPhone,
                            ticketNumber: winTicketNum,
                            prizeValue: prizeVal,
                            giveawayTitle: info.giveawayTitle,
                            threshold: win.percentage?.toString(),
                            baseUrl
                        }).catch(e => console.error('[PAYMENT] Error sending Bonus Draw email to admin:', e));

                        // Marcăm ca notificat pentru a nu trimite din nou
                        win.notified = true;
                    }

                    // Salvăm bonus_draws actualizat cu flag-ul notified
                    try {
                        await adminClient.request(
                            updateItem('giveaways' as any, gwId, {
                                bonus_draws: JSON.stringify(drawsList)
                            })
                        );
                        console.log(`[PAYMENT] ✅ Bonus draws marked as notified for giveaway ${gwId}`);
                    } catch (e) {
                        console.warn('[PAYMENT] Could not update notified flag:', e);
                    }
                }
            } catch (bonusErr: any) {
                console.error('[PAYMENT] Error checking Bonus Draws (non-blocking):', bonusErr?.message);
            }

        } catch (emailErr: any) {
            // Nu blocăm răspunsul pentru eroare de email
            console.error('[PAYMENT] Eroare la procesare email/bilete:', emailErr.message);
        }

        // --- RĂSPUNS FINAL: SUCCES ---
        return NextResponse.json({
            success: true,
            orderId,
            transactionId: nmiResult.transactionid,
            message: 'Payment processed successfully',
        });

    } catch (error: any) {
        console.error('[PAYMENT] Eroare fatală:', error.message || error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred during payment processing' },
            { status: 500 }
        );
    }
}
