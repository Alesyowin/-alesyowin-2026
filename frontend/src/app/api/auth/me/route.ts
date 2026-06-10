import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import { cookies } from 'next/headers';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

/**
 * GET /api/auth/me
 * Verifică sesiunea curentă bazată pe cookie
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('customer_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Sesiune inexistentă' }, { status: 401 });
        }

        const client = createDirectus(DIRECTUS_URL)
            .with(staticToken(ADMIN_TOKEN!))
            .with(rest());

        // Căutăm sesiunea
        const sessions = await client.request(
            readItems('customer_sessions', {
                filter: {
                    token: { _eq: token },
                    expires_at: { _gt: new Date().toISOString() }
                },
                fields: ['*', 'customer_id.*'],
                limit: 1
            })
        );

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({ error: 'Sesiune expirată sau invalidă' }, { status: 401 });
        }

        const session = sessions[0];
        const customer = session.customer_id;

        return NextResponse.json({ 
            user: {
                id: customer.id,
                email: customer.email,
                First_Name: customer.First_Name,
                Last_Name: customer.Last_Name,
                phone: customer.phone
            }
        });
    } catch (error: any) {
        console.error('[API Auth Me] Error:', error);
        return NextResponse.json({ error: 'Eroare la verificarea sesiunii' }, { status: 500 });
    }
}
