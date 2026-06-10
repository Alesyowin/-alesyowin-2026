import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, updateItem, staticToken } from '@directus/sdk';
import { getTranslations } from 'next-intl/server';
import { sendOrderConfirmationEmail, sendAdminOrderNotification, sendInstantWinnerEmail, sendAdminInstantWinnerEmail, sendBonusWinnerEmail, sendAdminBonusWinnerEmail } from '../../../lib/email';
import { fireTikTokEvent } from '../../../lib/tiktok';
import { getClientIP } from '../../../lib/rate-limit';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

// Initialize admin client
const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function POST(request: Request) {
    try {
        if (!ADMIN_TOKEN || ADMIN_TOKEN === 'ADAUGA_TOKEN_AICI') {
            return NextResponse.json({ error: 'Missing Server Admin Token' }, { status: 500 });
        }

        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        console.log(`[MOCK-PAYMENT] Validating attempt for Order: ${orderId}`);

        // 1. Get Order Data FIRST for security check
        // @ts-ignore
        const order = await adminClient.request(
            readItems('orders' as any, {
                filter: { id: { _eq: parseInt(orderId, 10) } },
                fields: ['client_email', 'client_phone', 'customer_name', 'Total_Amount', 'locale', 'status'] as any,
                limit: 1,
            })
        );

        if (!order || order.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const orderData = order[0];

        // 2. Security Check: Is it REALLY a free order?
        const amountNum = Number(orderData.Total_Amount);
        if (amountNum > 0) {
            console.error(`[MOCK-PAYMENT] ❌ FRAUD ATTEMPT: Tried to mock-pay an order with value £${amountNum}`);
            return NextResponse.json({ error: 'Security constraint: Cannot bypass payment for non-free orders' }, { status: 403 });
        }

        // 3. Prevent duplicate processing
        if (orderData.status === 'paid') {
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // 4. Update Order Status to PAID now that it's verified free
        await adminClient.request(
            updateItem('orders', orderId.toString(), { 
                status: 'paid' 
            })
        );

        // 4.1 TikTok S2S CompletePayment Event
        const ip = getClientIP(request);
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        fireTikTokEvent({
            event: 'CompletePayment',
            ip: ip || undefined,
            userAgent,
            email: orderData.client_email,
            phone: orderData.client_phone,
            properties: {
                value: 0,
                currency: 'GBP',
                contents: [{ content_id: 'giveaway', quantity: 1, price: 0 }]
            }
        });

        // 5. Wait 2s for Directus Hook to generate tickets
        await new Promise(resolve => setTimeout(resolve, 2000));

        const orderLocale = orderData.locale || 'en';

        // 4. Get Tickets for Email
        // @ts-ignore
        const tickets = await adminClient.request(
            readItems('tickets' as any, {
                filter: { order_id: { _eq: parseInt(orderId, 10) } },
                fields: ['ticket_number', 'giveaway_id'] as any,
                limit: 1000
            })
        );

        // 5. Build Products Map for Email Template
        const productsMap = new Map<number, { giveawayTitle: string, productImageUrl?: string, tickets: string[] }>();
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
            console.warn('[MOCK-PAYMENT] Nu am putut citi order_items detaliat:', oiErr);
        }

        if (giveawayIds.length > 0) {
            // @ts-ignore
            const giveaways = await adminClient.request(
                readItems('giveaways' as any, {
                    filter: { id: { _in: giveawayIds } },
                    fields: ['id', 'title', 'image', 'price', 'instant_prizes', 'bonus_draws', 'translations.languages_code', 'translations.title'] as any
                })
            );

            const host = request.headers.get('host') || 'gpcompetition.com';
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
                } as any);
            });
        }

        tickets.forEach((t: any) => {
            const prod = productsMap.get(t.giveaway_id);
            if (prod) prod.tickets.push(t.ticket_number);
        });

        // 6. Send Confirmation Email
        const t = await getTranslations({ locale: orderLocale, namespace: 'OrderEmail' });
        const host = request.headers.get('host') || 'gpcompetition.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        await sendOrderConfirmationEmail({
            to: orderData.client_email,
            customerName: orderData.customer_name || 'Customer',
            orderId: orderId.toString(),
            totalAmount: orderData.Total_Amount.toString(),
            products: Array.from(productsMap.values()),
            locale: orderLocale,
            translations: t,
            baseUrl
        });

        // 7. Trimitere email notificare admin (independent de emailul client)
        try {
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
                customerName: orderData.customer_name || 'Customer',
                customerEmail: orderData.client_email,
                products: adminProducts,
                totalAmount: orderData.Total_Amount ? orderData.Total_Amount.toString() : '0',
                baseUrl,
            });

            if (!adminEmailResult.success) {
                console.warn(`[MOCK-PAYMENT] ⚠️ Admin notification email failed:`, adminEmailResult.error);
            } else {
                console.log(`[MOCK-PAYMENT] ✅ Admin notification sent to gpcompetitionn@gmail.com`);
            }
        } catch (adminErr: any) {
            console.warn('[MOCK-PAYMENT] Admin email error (non-blocking):', adminErr?.message);
        }

        // 8. Verificare Instant Win
        try {
            console.log(`[MOCK-PAYMENT] Checking for Instant Wins on Order ${orderId}...`);
            const instantWins = [];
            const tInstant = await getTranslations({ locale: orderLocale, namespace: 'InstantWinnerEmail' });
            
            for (const [gwId, info] of Array.from(productsMap.entries())) {
                const instantPrizes = (info as any).instantPrizes;
                if (!instantPrizes) continue;
                
                let prizesList = [];
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
                console.log(`[MOCK-PAYMENT] Found ${instantWins.length} Instant Wins! Sending emails...`);
                
                for (const win of instantWins) {
                    await sendInstantWinnerEmail({
                        to: orderData.client_email,
                        customerName: orderData.customer_name || 'Customer',
                        ticketNumber: win.ticketNumber,
                        prizeValue: win.prizeValue,
                        giveawayTitle: win.giveawayTitle,
                        translations: tInstant,
                        baseUrl
                    }).catch(e => console.error('[MOCK-PAYMENT] Error sending Instant Win email to client', e));
                    
                    await sendAdminInstantWinnerEmail({
                        orderId: orderId.toString(),
                        customerName: orderData.customer_name || 'Customer',
                        customerEmail: orderData.client_email,
                        customerPhone: orderData.client_phone || 'Nespecificat',
                        ticketNumber: win.ticketNumber,
                        prizeValue: win.prizeValue,
                        giveawayTitle: win.giveawayTitle,
                        baseUrl
                    }).catch(e => console.error('[MOCK-PAYMENT] Error sending Instant Win email admin', e));
                }
            } else {
                console.log(`[MOCK-PAYMENT] No instant wins for Order ${orderId}.`);
            }
        } catch (instantErr: any) {
            console.error('[MOCK-PAYMENT] Error checking Instant Wins (non-blocking):', instantErr?.message);
        }

        // 9. Verificare Bonus Draws
        try {
            console.log(`[MOCK-PAYMENT] Checking for Bonus Draw wins on Order ${orderId}...`);
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

                    console.log(`[MOCK-PAYMENT] 🎉 Bonus Draw Winner found! Ticket #${winTicketNum} for ${win.winner_name}`);

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
                        console.warn('[MOCK-PAYMENT] Could not look up bonus winner ticket:', e);
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
                        }).catch(e => console.error('[MOCK-PAYMENT] Error sending Bonus Draw email to client:', e));
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
                    }).catch(e => console.error('[MOCK-PAYMENT] Error sending Bonus Draw email to admin:', e));

                    // Marcăm ca notificat
                    win.notified = true;
                }

                // Salvăm bonus_draws actualizat cu flag-ul notified
                try {
                    await adminClient.request(
                        updateItem('giveaways' as any, gwId, {
                            bonus_draws: JSON.stringify(drawsList)
                        })
                    );
                    console.log(`[MOCK-PAYMENT] ✅ Bonus draws marked as notified for giveaway ${gwId}`);
                } catch (e) {
                    console.warn('[MOCK-PAYMENT] Could not update notified flag:', e);
                }
            }
        } catch (bonusErr: any) {
            console.error('[MOCK-PAYMENT] Error checking Bonus Draws (non-blocking):', bonusErr?.message);
        }

        return NextResponse.json({ success: true, message: 'Mock payment success triggered' });

    } catch (error: any) {
        console.error('[MOCK-PAYMENT] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
