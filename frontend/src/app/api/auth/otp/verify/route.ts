import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, createItem, updateItem, staticToken } from '@directus/sdk';
import { cookies } from 'next/headers';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

export async function POST(request: Request) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: 'Date lipsă' }, { status: 400 });
        }

        const client = createDirectus(DIRECTUS_URL)
            .with(staticToken(ADMIN_TOKEN!))
            .with(rest());

        // 1. Verificăm codul
        const items = await client.request(
            readItems('auth_codes', {
                filter: {
                    email: { _eq: email.toLowerCase() },
                    debug_code: { _eq: code },
                    used: { _eq: false },
                    expires_at: { _gt: new Date().toISOString() }
                },
                sort: ['-date_created'],
                limit: 1
            })
        );

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cod invalid sau expirat' }, { status: 400 });
        }

        const authRecord = items[0];

        // 2. Marcăm codul ca utilizat
        await client.request(
            updateItem('auth_codes', authRecord.id, {
                used: true
            })
        );

        // 3. Găsim sau creăm clientul
        let customer;
        const customers = await client.request(
            readItems('customers', {
                filter: { email: { _eq: email.toLowerCase() } },
                limit: 1
            })
        );

        if (customers && customers.length > 0) {
            customer = customers[0];
            // Actualizăm last_login_at
            await client.request(
                updateItem('customers', customer.id, {
                    last_login_at: new Date().toISOString()
                })
            );
        } else {
            // Creăm client nou
            customer = await client.request(
                createItem('customers', {
                    email: email.toLowerCase(),
                    last_login_at: new Date().toISOString()
                })
            );
        }

        // 4. Creăm sesiunea (30 zile)
        const sessionToken = crypto.randomUUID();
        const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await client.request(
            createItem('customer_sessions', {
                token: sessionToken,
                expires_at: sessionExpiry,
                customer_id: customer.id
            })
        );

        // 5. Setăm cookie-ul
        const cookieStore = await cookies();
        cookieStore.set('customer_token', sessionToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 // 30 zile
        });

        return NextResponse.json({ 
            success: true, 
            user: {
                id: customer.id,
                email: customer.email,
                First_Name: customer.First_Name,
                Last_Name: customer.Last_Name
            }
        });
    } catch (error: any) {
        console.error('[API OTP Verify] Error:', error);
        return NextResponse.json({ error: 'Eroare la verificarea codului' }, { status: 500 });
    }
}
