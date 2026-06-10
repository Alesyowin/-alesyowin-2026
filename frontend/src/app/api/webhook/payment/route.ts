import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, updateItem } from '@directus/sdk';
import { staticToken } from '@directus/sdk';
import { getTranslations } from 'next-intl/server';
import { sendOrderConfirmationEmail, sendAdminOrderNotification, sendInstantWinnerEmail, sendAdminInstantWinnerEmail, sendBonusWinnerEmail, sendAdminBonusWinnerEmail } from '../../../../lib/email';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

// Client cu token admin, metoda corectă
const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function POST(request: Request) {
    try {
        if (!ADMIN_TOKEN || ADMIN_TOKEN === 'ADAUGA_TOKEN_AICI') {
            return NextResponse.json({ error: 'Missing Server Admin Token' }, { status: 500 });
        }

        const body = await request.json();
        const { orderId, secret } = body;

        // Verificare autentificare — doar Directus poate apela acest webhook
        if (secret !== process.env.DIRECTUS_ADMIN_TOKEN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }



        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId in webhook payload' }, { status: 400 });
        }

        console.log(`[WEBHOOK] Payment signal received for Order: ${orderId}`);

        // === PASUL 1: Marcăm comanda ca PLĂTITĂ ===
        try {
            // Folosim updateItem (singular) pentru a fi siguri că actualizăm exact această comandă
            await adminClient.request(
                updateItem('orders', orderId.toString(), { 
                    status: 'paid' 
                })
            );
            console.log(`[WEBHOOK] Order ${orderId} marked as PAID directly in database`);
        } catch (updateErr: any) {
            console.error(`[WEBHOOK] Critical failure updating order status:`, updateErr?.response?.data || updateErr?.message || updateErr);
            return NextResponse.json({ 
                error: 'Failed to update order status',
                details: updateErr?.message 
            }, { status: 500 });
        }

        // === PASUL 2: Colectare Date pentru Bilete și Email ===
        try {
            console.log(`[WEBHOOK] Fetching order data for ${orderId}...`);
            // Citim detaliile comenzii - selectăm doar câmpurile sigure
            const orderFields = ['id', 'client_email', 'client_phone', 'customer_name', 'Total_Amount'];
            
            // @ts-ignore
            const order = await adminClient.request(
                readItems('orders' as any, {
                    filter: { id: { _eq: parseInt(orderId, 10) } },
                    fields: orderFields as any,
                    limit: 1,
                })
            );

            const orderData = order?.[0];
            if (!orderData) {
                throw new Error('Order NOT FOUND in database. This shouldn\'t happen if status was updated.');
            }
            
            // Avem nevoie și de locale, dar îl cerem separat să nu crape dacă lipsește coloana
            let orderLocale = 'ro'; // Default
            try {
                // @ts-ignore
                const localeCheck = await adminClient.request(
                    readItems('orders' as any, {
                        filter: { id: { _eq: parseInt(orderId, 10) } },
                        fields: ['locale'] as any,
                        limit: 1
                    })
                );
                if (localeCheck?.[0]?.locale) {
                    orderLocale = localeCheck[0].locale;
                }
            } catch (lErr) {
                console.warn('[WEBHOOK] Could not fetch "locale" field, using default "ro"');
            }

            const customerName = orderData?.customer_name || orderData?.client_email || 'Client';
            const customerPhone = orderData?.client_phone || 'Nespecificat';

            // Capturăm datele host-ului
            const host = request.headers.get('host');
            const protocol = host?.includes('localhost') ? 'http' : 'https';
            const baseUrl = `${protocol}://${host}`;

            // PASUL 3: Așteptăm generarea biletelor
            console.log(`[WEBHOOK] Waiting 3s for tickets for Order ${orderId}...`);
            await new Promise(resolve => setTimeout(resolve, 3000));

            // PASUL 4: Citim biletele, adăugând și giveaway_id
            console.log(`[WEBHOOK] Reading tickets for email...`);
            // @ts-ignore
            const fullTickets = await adminClient.request(
                readItems('tickets' as any, {
                    filter: { order_id: { _eq: parseInt(orderId, 10) } },
                    fields: ['ticket_number', 'giveaway_id'] as any,
                    limit: 500
                })
            );
            console.log(`[WEBHOOK] Found ${fullTickets.length} tickets.`);

            // PASUL 5: Agregăm produsele cumpărate
            const productsMap = new Map<number, { giveawayTitle: string, productImageUrl?: string, tickets: string[] }>();
            
            // Extragem ID-urile unice ale concursurilor din bilete, și le adăugăm pe cele din order_items pentru siguranță
            const giveawayIds = new Set<number>();
            fullTickets.forEach(({ giveaway_id }: any) => {
                if (giveaway_id) giveawayIds.add(giveaway_id);
            });

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
                orderItemsData.forEach(({ giveaway_id }: any) => {
                    if (giveaway_id) giveawayIds.add(giveaway_id);
                });
            } catch (gErr) {
                console.warn('[WEBHOOK] Failed to fetch order items:', gErr);
            }

            // Descărcăm detaliile despre fiecare concurs
            if (giveawayIds.size > 0) {
                try {
                    // @ts-ignore
                    const giveaways = await adminClient.request(
                        readItems('giveaways' as any, {
                            filter: { id: { _in: Array.from(giveawayIds) } },
                            fields: ['id', 'title', 'image', 'price', 'instant_prizes', 'bonus_draws', 'translations.languages_code', 'translations.title'] as any
                        })
                    );
                    
                    // Salvăm datele giveaway într-un map pentru acces facil la preț/imagine
                    const giveawaysInfoMap = new Map<number, any>();
                    
                    // Pentru testele de pe localhost, forțăm URL-ul public pentru pozele din frontend (care are tokenul valid)
                    const actualBaseUrl = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
                        ? 'https://gpcompetition.com'
                        : baseUrl;

                    giveaways.forEach((g: any) => {
                        giveawaysInfoMap.set(g.id, g);
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
                            giveawayTitle: finalTitle || 'Competition Ticket',
                            // Fișierele din directus-assets sunt protejate (403), așa că folosim proxy-ul de Next.js
                            productImageUrl: g.image ? `${actualBaseUrl}/api/asset/${g.image}` : undefined,
                            tickets: [],
                            unitPrice: g.price || 0,
                            instantPrizes: g.instant_prizes,
                            bonusDraws: g.bonus_draws
                        } as any);
                    });
                } catch (err) {
                    console.error('[WEBHOOK] Core error fetching giveaways details:', err);
                }
            }

            // Punem biletele în sertarul corespunzător
            fullTickets.forEach(({ ticket_number, giveaway_id }: any) => {
                const product = productsMap.get(giveaway_id);
                if (product) {
                    product.tickets.push(ticket_number);
                } else {
                    // Daca dintr-un motiv un bilet n-are giveaway valid (siguranta)
                    let unknownProduct = productsMap.get(-1);
                    if (!unknownProduct) {
                        unknownProduct = { giveawayTitle: 'Competition Ticket', tickets: [] };
                        productsMap.set(-1, unknownProduct);
                    }
                    unknownProduct.tickets.push(ticket_number);
                }
            });

            const productsArray = Array.from(productsMap.values()).filter(p => p.tickets.length > 0);

            // PASUL 6: Trimitere Email
            console.log(`[WEBHOOK] Final step: Sending email via Resend...`);
            const t = await getTranslations({ locale: orderLocale, namespace: 'OrderEmail' });

            const emailResult = await sendOrderConfirmationEmail({
                to: orderData.client_email,
                customerName: customerName,
                orderId: orderId.toString(),
                totalAmount: orderData.Total_Amount ? orderData.Total_Amount.toString() : '0',
                products: productsArray,
                locale: orderLocale,
                translations: t,
                baseUrl
            });

            if (!emailResult.success) {
                console.log(`[WEBHOOK] ❌ Resend Error:`, emailResult.error);
            } else {
                console.log(`[WEBHOOK] ✅ SUCCESS! Email sent to ${orderData.client_email}`);
            }

            // PASUL 7: Trimitere email notificare admin (paralel, independent de emailul client)
            try {
                console.log(`[WEBHOOK] Sending admin notification email...`);

                // Construim lista de produse pentru admin. 
                // Încercăm din order_items, dar dacă e gol, facem fallback la ce avem deja în productsMap
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
                    // Fallback la datele din tickets (dacă order_items n-au venit din DB)
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
                    customerName: customerName,
                    customerEmail: orderData.client_email,
                    products: adminProducts,
                    totalAmount: orderData.Total_Amount ? orderData.Total_Amount.toString() : '0',
                    baseUrl,
                });

                if (!adminEmailResult.success) {
                    console.warn(`[WEBHOOK] ⚠️ Admin notification email failed:`, adminEmailResult.error);
                } else {
                    console.log(`[WEBHOOK] ✅ Admin notification sent to gpcompetitionn@gmail.com`);
                }
            } catch (adminErr: any) {
                // Nu blocăm fluxul principal dacă emailul admin eșuează
                console.warn('[WEBHOOK] Admin email error (non-blocking):', adminErr?.message);
            }

            // === PASUL 8: VERIFICARE INSTANT WIN ===
            try {
                console.log(`[WEBHOOK] Checking for Instant Wins on Order ${orderId}...`);
                const instantWins: { giveawayTitle: string; ticketNumber: any; prizeValue: string }[] = [];
                const tInstant = await getTranslations({ locale: orderLocale, namespace: 'InstantWinnerEmail' });
                
                // Parcurgem toate concursurile cumpărate din productsMap
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
                    console.log(`[WEBHOOK] Found ${instantWins.length} Instant Wins! Sending emails...`);
                    
                    for (const win of instantWins) {
                        // 8A. Trimitem email Client (Dark Mode + Gold)
                        await sendInstantWinnerEmail({
                            to: orderData.client_email,
                            customerName,
                            ticketNumber: win.ticketNumber,
                            prizeValue: win.prizeValue,
                            giveawayTitle: win.giveawayTitle,
                            translations: tInstant,
                            baseUrl
                        }).catch(e => console.error('[WEBHOOK] Error sending Instant Win email to client', e));
                        
                        // 8B. Trimitem email Admin
                        await sendAdminInstantWinnerEmail({
                            orderId: orderId.toString(),
                            customerName,
                            customerEmail: orderData.client_email,
                            customerPhone,
                            ticketNumber: win.ticketNumber,
                            prizeValue: win.prizeValue,
                            giveawayTitle: win.giveawayTitle,
                            baseUrl
                        }).catch(e => console.error('[WEBHOOK] Error sending Instant Win email to admin', e));
                    }
                } else {
                    console.log(`[WEBHOOK] No instant wins for Order ${orderId}.`);
                }
            } catch (instantErr: any) {
                console.error('[WEBHOOK] Error checking/sending Instant Wins (non-blocking):', instantErr?.message);
            }

            // === PASUL 9: VERIFICARE BONUS DRAWS ===
            try {
                console.log(`[WEBHOOK] Checking for Bonus Draw wins on Order ${orderId}...`);
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

                        console.log(`[WEBHOOK] 🎉 Bonus Draw Winner found! Ticket #${winTicketNum} for ${win.winner_name}`);

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
                            console.warn('[WEBHOOK] Could not look up bonus winner ticket:', e);
                        }

                        if (!winnerEmail) {
                            console.warn(`[WEBHOOK] Nu am găsit email-ul pentru biletul câștigător #${winTicketNum}. Trimitem doar la admin.`);
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
                            }).catch(e => console.error('[WEBHOOK] Error sending Bonus Draw email to client:', e));
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
                        }).catch(e => console.error('[WEBHOOK] Error sending Bonus Draw email to admin:', e));

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
                        console.log(`[WEBHOOK] ✅ Bonus draws marked as notified for giveaway ${gwId}`);
                    } catch (e) {
                        console.warn('[WEBHOOK] Could not update notified flag:', e);
                    }
                }
            } catch (bonusErr: any) {
                console.error('[WEBHOOK] Error checking Bonus Draws (non-blocking):', bonusErr?.message);
            }

        } catch (innerErr: any) {
            console.error('[WEBHOOK] Secondary processing error:', innerErr.message);
        }

        return NextResponse.json({
            success: true,
            message: 'Order paid and processed',
            orderId
        }, { status: 200 });

    } catch (error: any) {
        console.error('[WEBHOOK] Fatal error:', error.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
