import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createDirectus, rest, createItems, readItems, updateItem, staticToken } from '@directus/sdk';
import { CartItem } from '../../../lib/store';
import { cookies } from 'next/headers';
import { rateLimit, getClientIP } from '../../../lib/rate-limit';

// We get the URL from environment variables, fallback for safety
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.directus.app';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

// Initialize an admin client that bypasses public permissions
const adminClient = createDirectus(DIRECTUS_URL)
    .with(staticToken(ADMIN_TOKEN!))
    .with(rest());

export async function POST(request: Request) {
    // Protecție anti-spam: maximum 5 comenzi pe minut per IP
    const clientIP = getClientIP(request);
    if (!rateLimit(clientIP, 5)) {
        return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    try {
        if (!ADMIN_TOKEN || ADMIN_TOKEN === 'ADAUGA_TOKEN_AICI') {
            console.error('[API] Missing DIRECTUS_ADMIN_TOKEN in .env.local');
            return NextResponse.json(
                { error: 'Server is missing Directus Admin Token. Please configure .env.local' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { customer, items, total: clientTotal, locale, quizGiveawayId, quizAnswer, promoCode } = body;

        if (!customer || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required checkout data' }, { status: 400 });
        }

        // Funcție utilitară pentru a traduce valoarea literală din DB (a/b/c) în index numeric (0/1/2)
        function getQuizIndex(val: string | null | undefined): number {
            if (!val) return 0;
            const map: Record<string, number> = { a: 0, b: 1, c: 2, A: 0, B: 1, C: 2 };
            if (val in map) return map[val];
            const num = parseInt(val, 10);
            return isNaN(num) ? 0 : num;
        }

        // --- 0.1 VALIDARE QUIZ SERVER-SIDE (SECURITY) ---
        if (quizGiveawayId && typeof quizAnswer !== 'undefined') {
            try {
                // Interogăm Directus pentru câmpul REA (care este `correct_answer`, nu `correct_answer_index`)
                // @ts-ignore
                const quizCheck = await (adminClient as any).request(
                    readItems('giveaways' as any, {
                        filter: { id: { _eq: parseInt(quizGiveawayId, 10) } },
                        fields: ['correct_answer'] as any,
                        limit: 1
                    })
                );
                
                const gw = quizCheck?.[0];
                const realAnswerIndex = getQuizIndex(gw?.correct_answer);

                if (!gw || String(realAnswerIndex) !== String(quizAnswer)) {
                    console.warn(`[API] ⚠️ CRITICAL: Quiz validation failed! Expected Index: ${realAnswerIndex} (from DB '${gw?.correct_answer}'), Got: ${quizAnswer}`);
                    return NextResponse.json({ error: 'Invalid skill validation' }, { status: 400 });
                }
            } catch (qErr) {
                console.error('[API] Error validating quiz:', qErr);
                return NextResponse.json({ error: 'Quiz validation failed' }, { status: 500 });
            }
        } else {
            console.warn(`[API] ⚠️ CRITICAL: Quiz answer missing from payload.`);
            return NextResponse.json({ error: 'Invalid skill validation' }, { status: 400 });
        }

        // --- 0. CALCULARE PREȚ SERVER-SIDE (SECURITY) ---
        let calculatedTotal = 0;
        try {
            const giveawayIds = items.map((item: CartItem) => parseInt(item.id, 10));
            // @ts-ignore
            const giveawaysData = await (adminClient as any).request(
                readItems('giveaways' as any, {
                    filter: { id: { _in: giveawayIds } },
                    fields: ['id', 'price'] as any,
                })
            );

            const pricesMap = new Map<number, number>();
            if (giveawaysData) {
                giveawaysData.forEach((g: any) => {
                    pricesMap.set(g.id, Number(g.price) || 0);
                });
            }

            for (const item of items) {
                const gId = parseInt(item.id, 10);
                const realPrice = pricesMap.get(gId) || 0;
                calculatedTotal += realPrice * item.quantity;
            }
        } catch (priceErr) {
            console.error('[API] Error fetching real prices from Directus:', priceErr);
            return NextResponse.json({ error: 'Failed to validate prices server-side' }, { status: 500 });
        }

        // --- 0.2 VALIDARE PROMO CODE ȘI APLICARE REDUCERE ---
        let appliedPromoCodeId = null;
        if (promoCode) {
            try {
                // @ts-ignore
                const codes = await (adminClient as any).request(
                    readItems('promo_codes' as any, {
                        filter: { code: { _eq: promoCode.trim().toUpperCase() } },
                        limit: 1
                    })
                );

                if (codes && codes.length > 0) {
                    const promo = codes[0];
                    const isActive = promo.is_active;
                    const isNotExpired = !promo.valid_until || new Date() <= new Date(promo.valid_until);
                    const hasUsesLeft = promo.max_uses === null || promo.current_uses < promo.max_uses;

                    if (isActive && isNotExpired && hasUsesLeft) {
                        appliedPromoCodeId = promo.id;
                        const discount = (calculatedTotal * promo.discount_percentage) / 100;
                        calculatedTotal = Math.max(0, calculatedTotal - discount);
                        console.log(`[API] Promo code applied: ${promo.code} (-${promo.discount_percentage}%). New total: £${calculatedTotal}`);
                    } else {
                        console.warn(`[API] Invalid/Expired/Exhausted promo code provided: ${promoCode}`);
                        return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
                    }
                } else {
                    console.warn(`[API] Non-existent promo code provided: ${promoCode}`);
                    return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
                }
            } catch (promoErr) {
                console.error('[API] Error validating promo code:', promoErr);
                return NextResponse.json({ error: 'Promo code validation failed' }, { status: 500 });
            }
        }

        if (Math.abs(Number(clientTotal) - calculatedTotal) > 0.01) {
            console.warn(`[API] ⚠️ CRITICAL: Price mismatch! Client sent: £${clientTotal}, Server computed: £${calculatedTotal}`);
            return NextResponse.json({ error: 'Price mismatch detected' }, { status: 400 });
        }

        // Folosim de acum doar totalul garantat calculat pe server
        const total = calculatedTotal;

        const { firstName, lastName, email, phone, address, city, county, postal_code, country } = customer;

        // --- 1. HANDLE CUSTOMER ---
        let customerId: string | null = null;
        let isLoggedSession = false;

        // Încercăm să vedem dacă utilizatorul este logat
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('customer_token')?.value;

            if (token) {
                const sessions = await (adminClient as any).request(
                    readItems('customer_sessions', {
                        filter: { 
                            token: { _eq: token },
                            expires_at: { _gt: new Date().toISOString() }
                        },
                        limit: 1
                    })
                );
                if (sessions && sessions.length > 0) {
                    customerId = sessions[0].customer_id;
                    isLoggedSession = true;
                    console.log(`[API] Customer identified via session: ${customerId}`);
                }
            }
        } catch (authErr) {
            console.warn('[API] Auth check failed, falling back to email lookup:', authErr);
        }

        // Dacă e logat, actualizăm datele de contact în baza de date
        if (customerId && isLoggedSession) {
            try {
                console.log(`[API] Updating customer profile for ${customerId}`);
                await (adminClient as any).request(
                    updateItem('customers', customerId, {
                        First_Name: firstName,
                        Last_Name: lastName,
                        phone: phone
                    })
                );
            } catch (updateErr) {
                console.warn(`[API] Failed to update customer profile:`, updateErr);
                // Nu blocăm checkout-ul dacă eșuează doar update-ul de profil
            }
        }

        // Dacă nu e logat sau sesiunea e invalidă, căutăm după email ca înainte
        if (!customerId) {
            try {
                console.log(`[API] Looking up customer by email: ${email}`);
                const existingCustomers = await (adminClient as any).request(
                    readItems('customers', {
                        filter: { email: { _eq: email } },
                        limit: 1,
                    })
                );

                if (existingCustomers && existingCustomers.length > 0) {
                    // Clientul există deja — verificăm dacă are parolă setată (cont înregistrat)
                    const existingCustomer = existingCustomers[0];
                    if (existingCustomer.password && !isLoggedSession) {
                        // Emailul aparține unui cont cu parolă, dar utilizatorul nu e logat
                        // Permitem în continuare comanda (nu blocăm checkout-ul), dar logăm avertisment
                        console.warn(`[API] ⚠️ Comandă pe email existent (${email}) fără sesiune activă. Se permite, dar monitorizat.`);
                    }
                    customerId = existingCustomer.id;
                } else {
                    const newCustomer = await (adminClient as any).request(
                        createItems('customers', {
                            First_Name: firstName,
                            Last_Name: lastName,
                            email: email,
                            phone: phone,
                        })
                    );
                    customerId = newCustomer.id;
                }
            } catch (error: any) {
                console.error('[API] Customer processing failed:', error);
                return NextResponse.json({ error: 'Failed to process customer data' }, { status: 500 });
            }
        }

        // --- 2. HANDLE ORDER ---
        let orderId: string;
        try {
            console.log(`[API] Creating order for customer ${customerId}`);
            const newOrder = await (adminClient as any).request(
                createItems('orders', {
                    Customer_ID: customerId,
                    customer_name: `${firstName} ${lastName}`,
                    first_name: firstName,
                    last_name: lastName,
                    client_email: email,
                    client_phone: phone,
                    address: address,
                    city: city,
                    county: county,
                    postal_code: postal_code,
                    country: country,
                    quantity: items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0),
                    product_id: parseInt(items[0].id, 10),
                    Total_Amount: total,
                    status: 'pending',
                    locale: locale, // Salvăm limba pentru email viitor
                    ...(appliedPromoCodeId ? { promo_code: appliedPromoCodeId } : {})
                })
            );
            orderId = newOrder.id;
            console.log(`[API] Order created successfully: ${orderId}`);
        } catch (error: any) {
            console.error('[API] Order creation failed:', JSON.stringify(error?.errors || error));
            const directusError = error?.errors?.[0]?.message || error.message || 'Unknown error';
            return NextResponse.json({ error: `Directus error (Order): ${directusError}` }, { status: 500 });
        }

        // --- 3. HANDLE ORDER ITEMS ---
        try {
            console.log(`[API] Creating ${items.length} order items for Order ${orderId}`);
            const orderItemsPayload = items.map((item: CartItem) => ({
                order_id: orderId,
                giveaway_id: parseInt(item.id, 10),
                Giveaway_ID: parseInt(item.id, 10), // Hook expects this casing: item.giveaway_id || item.Giveaway_ID
                quantity: item.quantity,
                Quantity: item.quantity,            // Hook expects this casing: item.quantity || item.Quantity
                status: 'published',                // Items need to be active
            }));

            await (adminClient as any).request(createItems('order_items', orderItemsPayload));
            console.log(`[API] Order items created successfully.`);
        } catch (error: any) {
            console.error('[API] Order items creation failed:', JSON.stringify(error?.errors || error));
            const directusError = error?.errors?.[0]?.message || error.message || 'Unknown error';
            return NextResponse.json({ error: `Directus error (Items): ${directusError}` }, { status: 500 });
        }

        // --- 4. SUCCESS ---
        // Generăm un token secret pentru callback-ul de plată (protecție împotriva accesului neautorizat)
        const PAYTRIOT_KEY = process.env.PAYTRIOT_SECURITY_KEY || 'fallback-secret';
        const cbSecret = crypto.createHash('sha256').update(`${orderId}-${PAYTRIOT_KEY}`).digest('hex').substring(0, 16);
        
        return NextResponse.json({
            success: true,
            orderId: orderId,
            cbSecret: cbSecret,
            message: 'Order recorded successfully (Pending Payment).'
        }, { status: 200 });

    } catch (error: any) {
        console.error('[API] Checkout sequence failed:', error.message || error);
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred during checkout.' },
            { status: 500 }
        );
    }
}
