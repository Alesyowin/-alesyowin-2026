import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, aggregate, staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const giveawayId = searchParams.get('giveawayId');
    const pageParam = searchParams.get('page') || '1';
    const limitParam = searchParams.get('limit') || '50';

    if (!giveawayId) {
        return NextResponse.json({ tickets: [], total: 0 }, { status: 400 });
    }

    const gIdInt = parseInt(giveawayId, 10);
    const page = parseInt(pageParam, 10);
    const limit = parseInt(limitParam, 10);

    try {
        // Obținem numărul total de bilete pentru paginare
        // @ts-ignore
        const aggResult = await (adminClient as any).request(
            aggregate('tickets' as any, {
                query: { filter: { giveaway_id: { _eq: gIdInt } } },
                aggregate: { count: '*' },
            })
        );
        const total = aggResult?.[0]?.count ? parseInt(aggResult[0].count, 10) : 0;

        // Fetch paginat
        // @ts-ignore
        const tickets = await (adminClient as any).request(
            readItems('tickets' as any, {
                filter: { giveaway_id: { _eq: gIdInt } },
                fields: ['id', 'ticket_number', 'email', 'client_name', 'order_id', 'date_created'],
                limit: limit,
                offset: (page - 1) * limit,
                sort: ['ticket_number'],
            })
        );

        return NextResponse.json({
            tickets: tickets || [],
            total,
            page,
            limit
        });

    } catch (error: any) {
        console.error('[all-tickets] Error:', error?.errors?.[0]?.message || error?.message);
        return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 });
    }
}
