import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import { cookies } from 'next/headers';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('customer_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Sesiune inexistentă' }, { status: 401 });
        }

        const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

        // 1. Verificăm sesiunea și luăm customer_id
        const sessions = await (client as any).request(
            // @ts-ignore
            readItems('customer_sessions' as any, {
                filter: {
                    token: { _eq: token },
                    expires_at: { _gt: new Date().toISOString() }
                },
                limit: 1
            })
        );

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({ error: 'Sesiune invalidă' }, { status: 401 });
        }

        const customerId = sessions[0].customer_id;

        // 2. Fetch orders with order_items
        const orders = await (client as any).request(
            // @ts-ignore
            readItems('orders' as any, {
                filter: {
                    Customer_ID: { _eq: customerId },
                    status: { _eq: 'paid' }
                },
                fields: [
                    'id', 
                    'date_created', 
                    'Total_Amount',
                    'order_items.giveaway_id.title', 
                    'order_items.Giveaway_ID.title'
                ],
                sort: ['-date_created']
            })
        );

        if (orders && orders.length > 0) {
            // 3. Fetch all tickets for these orders separately since the relation might not be aliased
            const orderIds = orders.map((o: any) => o.id);
            const allTickets = await (client as any).request(
                // @ts-ignore
                readItems('tickets' as any, {
                    filter: {
                        order_id: { _in: orderIds }
                    },
                    fields: ['ticket_number', 'order_id'],
                    limit: -1 // Toate biletele
                })
            );

            // Group tickets by order_id
            const ticketsByOrder = allTickets.reduce((acc: any, t: any) => {
                if (!acc[t.order_id]) acc[t.order_id] = [];
                acc[t.order_id].push(t);
                return acc;
            }, {});

            // Associate with orders
            orders.forEach((o: any) => {
                o.tickets = ticketsByOrder[o.id] || [];
            });
        }

        return NextResponse.json({ orders });

    } catch (error: any) {
        console.error('[API Orders History] Error:', error);
        return NextResponse.json({ error: 'Eroare la preluarea istoricului' }, { status: 500 });
    }
}
