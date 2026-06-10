import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import { cookies } from 'next/headers';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

// Verifică dacă utilizatorul logat a mai participat la un concurs specific
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const giveawayId = searchParams.get('giveawayId');

        if (!giveawayId) {
            return NextResponse.json({ hasEntered: false });
        }

        // Citim token-ul de sesiune din cookie
        const cookieStore = await cookies();
        const token = cookieStore.get('customer_token')?.value;

        if (!token) {
            // Nu e logat — nu a participat (din perspectiva sesiunii)
            return NextResponse.json({ hasEntered: false });
        }

        // Găsim customer_id după token
        // @ts-ignore
        const sessions = await adminClient.request(
            readItems('customer_sessions', {
                filter: {
                    token: { _eq: token },
                    expires_at: { _gt: new Date().toISOString() }
                },
                limit: 1
            })
        );

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({ hasEntered: false });
        }

        const customerId = sessions[0].customer_id;

        // Căutăm comenzi plătite ale acestui customer pentru concursul dat
        // @ts-ignore
        const existingOrders = await adminClient.request(
            readItems('orders', {
                filter: {
                    Customer_ID: { _eq: customerId },
                    product_id: { _eq: parseInt(giveawayId, 10) },
                    status: { _eq: 'paid' }
                },
                limit: 1
            })
        );

        const hasEntered = existingOrders && existingOrders.length > 0;

        return NextResponse.json({ hasEntered });

    } catch (error: any) {
        console.error('[check-entry] Error:', error.message);
        // În caz de eroare, permitem accesul (fail-open) ca să nu blocăm utilizatorul
        return NextResponse.json({ hasEntered: false });
    }
}
