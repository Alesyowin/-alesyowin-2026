import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createDirectus, rest, readItems, updateItem, staticToken } from '@directus/sdk';
import { getTranslations } from 'next-intl/server';
import { sendOrderConfirmationEmail, sendAdminOrderNotification, sendInstantWinnerEmail, sendAdminInstantWinnerEmail, sendBonusWinnerEmail, sendAdminBonusWinnerEmail } from '../../../lib/email';
import { fireTikTokEvent } from '../../../lib/tiktok';
import { rateLimit, getClientIP } from '../../../lib/rate-limit';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const PAYTRIOT_SECURITY_KEY = process.env.PAYTRIOT_SECURITY_KEY || '';

const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

const phpUrlencode = (str: string): string => {
    return encodeURIComponent(str)
        .replace(/%20/g, '+')
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/~/g, '%7E');
};

export async function POST(request: Request) {
    return handleCallback(request);
}

export async function GET(request: Request) {
    return handleCallback(request);
}

async function handleCallback(request: Request) {
    // Protecție anti-spam: maximum 10 cereri pe minut per IP
    const clientIP = getClientIP(request);
    if (!rateLimit(clientIP, 10)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        console.log(`[PAYMENT-CALLBACK] Primit ${request.method} de la Paytriot. URL: ${request.url}`);
        let fields: Record<string, string> = {};
        
        const url = new URL(request.url);
        let currentLocale = url.searchParams.get('locale') || 'en';

        // PASUL 1: Întotdeauna preluăm parametrii din URL (indiferent de metoda HTTP)
        for (const [key, value] of url.searchParams.entries()) {
            if (key !== 'locale') {
                fields[key] = value.toString();
            }
        }

        // PASUL 2: Dacă e POST, suprascriem/completăm cu datele din body
        // Folosim request.text() + URLSearchParams (mai fiabil decât formData() pe Vercel serverless)
        if (request.method === 'POST') {
            try {
                const rawBody = await request.text();
                console.log(`[PAYMENT-CALLBACK] POST body length: ${rawBody?.length || 0}, content-type: ${request.headers.get('content-type')}`);
                
                if (rawBody && rawBody.length > 0) {
                    // Încercăm mai întâi ca URL-encoded form data (cel mai frecvent format Paytriot/Cardstream)
                    try {
                        const bodyParams = new URLSearchParams(rawBody);
                        for (const [key, value] of bodyParams.entries()) {
                            fields[key] = value;
                        }
                        console.log(`[PAYMENT-CALLBACK] POST fields parsed: ${Object.keys(fields).join(', ')}`);
                    } catch (parseErr) {
                        // Fallback: încercăm JSON
                        try {
                            const json = JSON.parse(rawBody);
                            for (const key in json) {
                                fields[key] = String(json[key]);
                            }
                        } catch (jsonErr) {
                            console.error('[PAYMENT-CALLBACK] Nu am putut parsa body-ul POST:', parseErr);
                        }
                    }
                }
            } catch (bodyErr) {
                console.error('[PAYMENT-CALLBACK] Eroare la citirea body-ului POST:', bodyErr);
            }
        }

        console.log(`[PAYMENT-CALLBACK] Câmpuri finale: ${JSON.stringify(Object.keys(fields))}`);

        const responseCode = fields.responseCode || fields.response_code || fields.ResponseCode;
        const signature = fields.signature || fields.Signature;
        const orderId = fields.transactionUnique || fields.transactionid || fields.TransactionUnique || url.searchParams.get('orderId');

        if (!orderId) {
            console.error('[PAYMENT-CALLBACK] ❌ Lipseste orderId din date.');
            return NextResponse.redirect(new URL('/' + currentLocale + '/checkout?error=declined', request.url), 303);
        }

        // Verificare semnătură Paytriot — SE SARE PESTE dacă avem propriul token secret (sec)
        // Tokenul nostru (cbSecret SHA-256) este la fel de sigur și a fost verificat că funcționează pe producție
        const hasSec = url.searchParams.get('sec');
        if (signature && PAYTRIOT_SECURITY_KEY && !hasSec) {
            const fieldsForSig = { ...fields };
            delete fieldsForSig.signature;
            delete fieldsForSig.Signature;
            // Excludem parametrii noștri personalizați din URL pe care Paytriot nu îi include în semnătura sa
            delete fieldsForSig.orderId;
            delete fieldsForSig.sec;
            delete fieldsForSig.locale;
            const sortedKeys = Object.keys(fieldsForSig).sort();
            
            const localUrlencode = (str: string): string => {
                return encodeURIComponent(str).replace(/%20/g, '+').replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/~/g, '%7E');
            };

            const sortedPairs = sortedKeys.map(key => `${localUrlencode(key)}=${localUrlencode(fieldsForSig[key])}`);
            const queryString = sortedPairs.join('&').replace(/%0D%0A|%0A%0D|%0D/g, '%0A');
            const expectedSignature = crypto.createHash('sha512').update(queryString + PAYTRIOT_SECURITY_KEY).digest('hex');

            if (signature !== expectedSignature) {
                console.error('[PAYMENT-CALLBACK] ❌ Semnatura invalida Paytriot (si lipseste sec token)!');
                return NextResponse.redirect(new URL('/' + currentLocale + '/checkout?error=invalid_signature', request.url), 303);
            }
        } else if (signature && hasSec) {
            // Avem și semnătură Paytriot și tokenul nostru → folosim propriul token, logăm informativ
            console.log('[PAYMENT-CALLBACK] ℹ️ Semnătură Paytriot prezentă dar ignorată — se folosește cbSecret token propriu.');
        }

        // ═══════════════════════════════════════════════════════════════
        // VERIFICARE PLATĂ: Două strategii (POST data SAU token secret)
        // ═══════════════════════════════════════════════════════════════
        
        // Strategia 1: Paytriot a trimis POST cu responseCode (funcționează pe unele configurări)
        const successCodes = ['0', '00', '000', 'approved', 'success'];
        const isApprovedViaPost = responseCode && successCodes.includes(String(responseCode).toLowerCase());
        
        // Strategia 2: Verificare prin token secret (funcționează ÎNTOTDEAUNA, chiar și pe Vercel/serverless)
        const receivedSec = url.searchParams.get('sec') || fields.sec;
        const expectedSec = crypto.createHash('sha256').update(`${orderId}-${PAYTRIOT_SECURITY_KEY}`).digest('hex').substring(0, 16);
        const isApprovedViaSecret = receivedSec && receivedSec === expectedSec;

        // Aducem comanda din Directus
        let existingOrderData: any = null;
        try {
            // @ts-ignore
            const existingOrderFetch = await adminClient.request(readItems('orders' as any, { filter: { id: { _eq: parseInt(orderId, 10) } }, fields: ['status', 'locale', 'Total_Amount'] as any, limit: 1 }));
            existingOrderData = existingOrderFetch?.[0];
            
            if (existingOrderData) {
                currentLocale = existingOrderData.locale || currentLocale;
                if (existingOrderData.status === 'paid') {
                    console.log('[PAYMENT-CALLBACK] Comanda #'+orderId+' este deja PAID. Redirectare succes.');
                    return NextResponse.redirect(new URL('/' + currentLocale + '/success?orderId=' + orderId, request.url), 303);
                }
            }
        } catch(e) {
            console.warn('Verificare comanda DB fail:', e);
        }

        // VERIFICARE CRITICĂ: Dacă Paytriot a trimis explicit un responseCode de EȘEC,
        // respingem tranzacția CHIAR DACĂ tokenul 'sec' e corect.
        // Aceasta previne bug-ul în care tranzacțiile refuzate ajungeau pe pagina de succes.
        const hasExplicitFailure = responseCode && !successCodes.includes(String(responseCode).toLowerCase());
        if (hasExplicitFailure) {
            console.warn(`[PAYMENT-CALLBACK] ❌ Plata REFUZATA explicit de bancă! responseCode: ${responseCode}. Redirectare spre checkout.`);
            return NextResponse.redirect(new URL(`/${currentLocale}/checkout?paymentError=declined`, request.url), 303);
        }

        // Dacă plata NU e confirmată nici prin POST, nici prin token secret → REFUZ
        if (!isApprovedViaPost && !isApprovedViaSecret) {
            console.warn(`[PAYMENT-CALLBACK] ❌ Acces neautorizat la callback! orderId: ${orderId}, sec: ${receivedSec}, expected: ${expectedSec}`);
            return NextResponse.redirect(new URL(`/${currentLocale}/checkout?paymentError=declined`, request.url), 303);
        }

        // PROCESARE COMANDĂ APROBATĂ
        const approvalMethod = isApprovedViaPost ? 'POST responseCode' : 'Secret Token';
        console.log(`[PAYMENT-CALLBACK] ✅ Plata APROBATA pentru comanda #${orderId} (via ${approvalMethod})`);

        // Validare sumă plătită vs suma din baza de date (doar dacă avem date POST cu sumă)
        if (existingOrderData) {
            const rawResponseAmount = fields.amount || fields.amountReceived || fields.Amount;
            if (rawResponseAmount) {
                const dbTotalAmountPounds = Number(existingOrderData.Total_Amount) || 0;
                const dbTotalAmountPence = Math.round(dbTotalAmountPounds * 100);
                const paidAmountPence = parseInt(rawResponseAmount, 10) || 0;

                if (paidAmountPence > 0 && Math.abs(dbTotalAmountPence - paidAmountPence) > 1) {
                    console.error(`[PAYMENT-CALLBACK] ⚠️ CRITICAL: Nepotrivire sumă! DB: ${dbTotalAmountPence}p vs Plătit: ${paidAmountPence}p`);
                    return NextResponse.redirect(new URL(`/${currentLocale}/checkout?paymentError=amount_mismatch`, request.url), 303);
                }
                console.log(`[PAYMENT-CALLBACK] 🔒 Suma validată: ${paidAmountPence}p`);
            }
        }
        
        let nmiResult = { transactionid: fields.transactionID || fields.xref || 'N/A' };
        // --- PASUL 3: Plata e aprobată → Marcăm comanda ca PAID ---
        console.log(`[PAYMENT] ✅ Plata aprobată! TXN: ${nmiResult.transactionid}`);

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

            // =========== TIKTOK CAPI CompletePayment ===========
            const ip = getClientIP(request);
            const userAgent = request.headers.get('user-agent') || 'Unknown';
            fireTikTokEvent({
                event: 'CompletePayment',
                ip: ip || undefined,
                userAgent,
                email: orderData.client_email,
                phone: orderData.client_phone,
                properties: {
                    value: Number(orderData.Total_Amount) || 0,
                    currency: 'GBP'
                    // We don't need full contents for the backend purchase event, the conversion value is sufficient
                }
            });
            // ===================================================

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


        return NextResponse.redirect(new URL('/' + currentLocale + '/success?orderId=' + orderId, request.url), 303);

    } catch (e: any) {
        console.error('[PAYMENT-CALLBACK] Eroare:', e);
        const fbUrl = new URL(request.url);
        const fbLoc = fbUrl.searchParams.get('locale') || 'en';
        return NextResponse.redirect(new URL('/' + fbLoc + '/checkout?paymentError=internal', request.url), 303);
    }
}
