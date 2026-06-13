import { createDirectus, rest, readItems, updateItem, staticToken } from '@directus/sdk';
import { getTranslations } from 'next-intl/server';
import { sendOrderConfirmationEmail, sendAdminOrderNotification, sendInstantWinnerEmail, sendAdminInstantWinnerEmail, sendBonusWinnerEmail, sendAdminBonusWinnerEmail } from './email';
import { fireTikTokEvent } from './tiktok';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://alesyowin-backend.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function processPostPayment({
    orderId,
    host = 'alesyowin.com',
    ip,
    userAgent = 'Unknown'
}: {
    orderId: string | number;
    host?: string;
    ip?: string;
    userAgent?: string;
}) {
    console.log(`[POST-PAYMENT] Starting post-payment processing for Order: ${orderId}`);

    try {
        // 1. Get Order Data
        // @ts-ignore
        const order = await adminClient.request(
            readItems('orders' as any, {
                filter: { id: { _eq: parseInt(orderId.toString(), 10) } },
                fields: ['client_email', 'client_phone', 'customer_name', 'Total_Amount', 'locale', 'status', 'promo_code'] as any,
                limit: 1,
            })
        );

        if (!order || order.length === 0) {
            console.error(`[POST-PAYMENT] Order not found: ${orderId}`);
            return { success: false, error: 'Order not found' };
        }

        const orderData = order[0];

        // 2. Prevent duplicate processing
        if (orderData.status === 'paid') {
            console.log(`[POST-PAYMENT] Order ${orderId} is already paid. Skipping duplicate processing.`);
            return { success: true, message: 'Already processed' };
        }

        // 3. Extragem order_items ACUM, înainte de a seta 'paid', ca serverul Directus să nu fie încărcat
        let orderItemsData: any[] = [];
        try {
            // @ts-ignore
            orderItemsData = await adminClient.request(
                readItems('order_items' as any, {
                    filter: { order_id: { _eq: parseInt(orderId.toString(), 10) } },
                    fields: ['giveaway_id', 'quantity', 'unit_price', 'line_total', 'Quantity'] as any
                })
            );
        } catch (oiErr) {
            console.warn('[POST-PAYMENT] Could not read order_items details:', oiErr);
        }

        const expectedTickets = orderItemsData.reduce((sum: number, item: any) => sum + (Number(item.quantity) || Number(item.Quantity) || 1), 0);

        // 4. Update Order Status to PAID (Acest pas declanșează masivul hook de bilete în background)
        await adminClient.request(
            updateItem('orders', orderId.toString(), { 
                status: 'paid' 
            })
        );

        // 4.1 Increment Promo Code usage
        if (orderData.promo_code) {
            try {
                // @ts-ignore
                const promoData = await adminClient.request(readItems('promo_codes' as any, { filter: { id: { _eq: orderData.promo_code } }, limit: 1 }));
                if (promoData && promoData.length > 0) {
                    const currentUses = promoData[0].current_uses || 0;
                    // @ts-ignore
                    await adminClient.request(updateItem('promo_codes' as any, orderData.promo_code, { current_uses: currentUses + 1 }));
                    console.log(`[POST-PAYMENT] Incremented usage for promo code ${orderData.promo_code}`);
                }
            } catch (err) {
                console.warn('[POST-PAYMENT] Failed to increment promo code usage:', err);
            }
        }

        // 5. TikTok S2S CompletePayment Event
        fireTikTokEvent({
            event: 'CompletePayment',
            ip: ip || undefined,
            userAgent,
            email: orderData.client_email,
            phone: orderData.client_phone,
            properties: {
                value: Number(orderData.Total_Amount) || 0,
                currency: 'GBP',
                contents: [{ content_id: 'giveaway', quantity: 1, price: Number(orderData.Total_Amount) || 0 }]
            }
        });

        // 6. Smart polling to wait for Directus Hook to generate tickets
        console.log(`[POST-PAYMENT] Waiting for ${expectedTickets} tickets to generate...`);
        let tickets: any[] = [];
        let attempts = 0;
        const maxAttempts = 10; // 10 seconds max wait for Vercel timeout safety

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            // @ts-ignore
            tickets = await adminClient.request(
                readItems('tickets' as any, {
                    filter: { order_id: { _eq: parseInt(orderId.toString(), 10) } },
                    fields: ['ticket_number', 'giveaway_id'] as any,
                    limit: -1
                })
            );
            if (tickets.length >= expectedTickets) {
                console.log(`[POST-PAYMENT] All ${tickets.length} tickets successfully generated!`);
                break;
            }
            console.log(`[POST-PAYMENT] Attempt ${attempts + 1}: Found ${tickets.length} tickets, expecting ${expectedTickets}. Waiting...`);
            attempts++;
        }

        const orderLocale = orderData.locale || 'en';

        // 7. Build Products Map for Email Template
        const productsMap = new Map<number, { giveawayTitle: string, productImageUrl?: string, tickets: string[], unitPrice: number, instantPrizes: any, bonusDraws: any }>();
        
        // Asigurăm-ne că adăugăm giveaway-urile din comanda inițială, chiar dacă unele bilete încă se procesează
        const giveawayIdsFromItems = orderItemsData.map((oi: any) => oi.giveaway_id);
        const giveawayIdsFromTickets = tickets.map((t: any) => t.giveaway_id);
        const giveawayIds = Array.from(new Set([...giveawayIdsFromItems, ...giveawayIdsFromTickets]));

        if (giveawayIds.length > 0) {
            // @ts-ignore
            const giveaways = await adminClient.request(
                readItems('giveaways' as any, {
                    filter: { id: { _in: giveawayIds } },
                    fields: ['id', 'title', 'image', 'price', 'instant_prizes', 'bonus_draws', 'translations.languages_code', 'translations.title'] as any
                })
            );

            const protocol: string = host.includes('localhost') ? 'http' : 'https';
            const internalBaseUrl = `${protocol}://${host}`;

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
                    productImageUrl: g.image ? `${internalBaseUrl}/api/asset/${g.image}?width=600` : undefined,
                    tickets: [],
                    unitPrice: g.price || 0,
                    instantPrizes: g.instant_prizes,
                    bonusDraws: g.bonus_draws
                });
            });
        }

        tickets.forEach((t: any) => {
            const prod = productsMap.get(t.giveaway_id);
            if (prod) prod.tickets.push(t.ticket_number);
        });

        // 8. Send Confirmation Email
        const t = await getTranslations({ locale: orderLocale, namespace: 'OrderEmail' });
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        try {
            await sendOrderConfirmationEmail({
                to: orderData.client_email,
                customerName: orderData.customer_name || 'Customer',
                orderId: orderId.toString(),
                totalAmount: orderData.Total_Amount ? orderData.Total_Amount.toString() : '0',
                products: Array.from(productsMap.values()),
                locale: orderLocale,
                translations: t,
                baseUrl
            });
            console.log(`[POST-PAYMENT] Client confirmation email sent`);
        } catch (e) {
            console.error('[POST-PAYMENT] Client email error:', e);
        }

        // 9. Send Admin Notification Email
        try {
            let adminProducts: any[] = [];
            
            if (orderItemsData && orderItemsData.length > 0) {
                adminProducts = orderItemsData.map((item: any) => {
                    const gId = item.giveaway_id;
                    const productInfo = productsMap.get(gId);
                    const qty = item.quantity || item.Quantity || 1;
                    const unitPrice = item.unit_price || productInfo?.unitPrice || 0;
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
                adminProducts = Array.from(productsMap.entries()).map(([gId, info]) => {
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

            await sendAdminOrderNotification({
                orderId: orderId.toString(),
                customerName: orderData.customer_name || 'Customer',
                customerEmail: orderData.client_email,
                products: adminProducts,
                totalAmount: orderData.Total_Amount ? orderData.Total_Amount.toString() : '0',
                baseUrl,
            });
            console.log(`[POST-PAYMENT] Admin notification email sent`);
        } catch (adminErr: any) {
            console.warn('[POST-PAYMENT] Admin email error (non-blocking):', adminErr?.message);
        }

        // 10. Check Instant Wins
        try {
            const instantWins = [];
            const tInstant = await getTranslations({ locale: orderLocale, namespace: 'InstantWinnerEmail' });
            
            for (const [gwId, info] of Array.from(productsMap.entries())) {
                const instantPrizes = info.instantPrizes;
                if (!instantPrizes) continue;
                
                let prizesList: any[] = [];
                if (typeof instantPrizes === 'string') {
                    try { prizesList = JSON.parse(instantPrizes); } catch(e) {}
                } else if (Array.isArray(instantPrizes)) {
                    prizesList = instantPrizes;
                }
                
                if (prizesList.length === 0) continue;
                
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
                console.log(`[POST-PAYMENT] Found ${instantWins.length} Instant Wins! Sending emails...`);
                for (const win of instantWins) {
                    await sendInstantWinnerEmail({
                        to: orderData.client_email,
                        customerName: orderData.customer_name || 'Customer',
                        ticketNumber: win.ticketNumber,
                        prizeValue: win.prizeValue,
                        giveawayTitle: win.giveawayTitle,
                        translations: tInstant,
                        baseUrl
                    }).catch(e => console.error('[POST-PAYMENT] Error sending Instant Win email to client', e));
                    
                    await sendAdminInstantWinnerEmail({
                        orderId: orderId.toString(),
                        customerName: orderData.customer_name || 'Customer',
                        customerEmail: orderData.client_email,
                        customerPhone: orderData.client_phone || 'Nespecificat',
                        ticketNumber: win.ticketNumber,
                        prizeValue: win.prizeValue,
                        giveawayTitle: win.giveawayTitle,
                        baseUrl
                    }).catch(e => console.error('[POST-PAYMENT] Error sending Instant Win email admin', e));
                }
            }
        } catch (instantErr: any) {
            console.error('[POST-PAYMENT] Error checking Instant Wins (non-blocking):', instantErr?.message);
        }

        // 11. Check Bonus Draws
        try {
            for (const [gwId, info] of Array.from(productsMap.entries())) {
                const gwBonusDraws = info.bonusDraws;
                if (!gwBonusDraws) continue;

                let drawsList: any[] = [];
                if (typeof gwBonusDraws === 'string') {
                    try { drawsList = JSON.parse(gwBonusDraws); } catch(e) {}
                } else if (Array.isArray(gwBonusDraws)) {
                    drawsList = gwBonusDraws;
                }

                if (drawsList.length === 0) continue;

                const newWins = drawsList.filter((d: any) => d.is_won === true && !d.notified);
                if (newWins.length === 0) continue;

                for (const win of newWins) {
                    const winTicketNum = win.winner_ticket;
                    if (!winTicketNum) continue;

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
                        console.warn('[POST-PAYMENT] Could not look up bonus winner ticket:', e);
                    }

                    const prizeVal = win.prize_amount ? `${win.prize_amount} ${win.prize_currency || ''}`.trim() : 'Bonus Prize';
                    const tBonusLocale = await getTranslations({ locale: winnerLocale, namespace: 'BonusWinnerEmail' });

                    if (winnerEmail) {
                        await sendBonusWinnerEmail({
                            to: winnerEmail,
                            customerName: winnerName,
                            ticketNumber: winTicketNum,
                            prizeValue: prizeVal,
                            giveawayTitle: info.giveawayTitle,
                            translations: tBonusLocale,
                            baseUrl
                        }).catch(e => console.error('[POST-PAYMENT] Error sending Bonus Draw email to client:', e));
                    }

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
                    }).catch(e => console.error('[POST-PAYMENT] Error sending Bonus Draw email to admin:', e));

                    win.notified = true;
                }

                try {
                    await adminClient.request(
                        updateItem('giveaways' as any, gwId, {
                            bonus_draws: JSON.stringify(drawsList)
                        })
                    );
                } catch (e) {
                    console.warn('[POST-PAYMENT] Could not update notified flag:', e);
                }
            }
        } catch (bonusErr: any) {
            console.error('[POST-PAYMENT] Error checking Bonus Draws (non-blocking):', bonusErr?.message);
        }

        console.log(`[POST-PAYMENT] Successfully completed post-payment processing for Order: ${orderId}`);
        return { success: true };

    } catch (error: any) {
        console.error(`[POST-PAYMENT] Critical Error processing order ${orderId}:`, error);
        return { success: false, error: error.message };
    }
}
