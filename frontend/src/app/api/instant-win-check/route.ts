import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems } from '@directus/sdk';
import { staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

// Client Directus cu token admin
const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ won: false, error: 'Missing orderId' }, { status: 400 });
        }

        if (!ADMIN_TOKEN) {
            return NextResponse.json({ won: false, error: 'Missing admin token' }, { status: 500 });
        }

        // Citim biletele generate pentru această comandă
        const tickets = await (adminClient as any).request(
            readItems('tickets', {
                filter: { order_id: { _eq: parseInt(orderId, 10) } },
                fields: ['id', 'ticket_number', 'giveaway_id'],
                limit: 500,
            })
        );

        if (!tickets || tickets.length === 0) {
            return NextResponse.json({ won: false });
        }

        // Grupăm biletele pe giveaway
        const ticketsByGiveaway: Record<string, number[]> = {};
        for (const ticket of tickets) {
            const gId = String(ticket.giveaway_id);
            if (!ticketsByGiveaway[gId]) ticketsByGiveaway[gId] = [];
            ticketsByGiveaway[gId].push(ticket.ticket_number);
        }

        // Verificăm fiecare giveaway
        for (const [giveawayId, ticketNumbers] of Object.entries(ticketsByGiveaway)) {
            const giveawayArr = await (adminClient as any).request(
                readItems('giveaways', {
                    filter: { id: { _eq: parseInt(giveawayId, 10) } },
                    fields: ['id', 'instant_prizes'],
                    limit: 1,
                })
            );
            const gw = giveawayArr?.[0];
            if (!gw || !gw.instant_prizes) continue;

            // Parsăm instant_prizes
            let prizes: any[] = [];
            try {
                prizes = typeof gw.instant_prizes === 'string'
                    ? JSON.parse(gw.instant_prizes)
                    : gw.instant_prizes;
            } catch { continue; }

            if (!Array.isArray(prizes)) continue;

            // Creăm un Set cu numerele de bilete ale clientului
            const clientTicketSet = new Set(ticketNumbers.map(n => Number(n)));

            // Căutăm un premiu câștigat care se potrivește cu un bilet al clientului
            const won = prizes.find((p: any) =>
                p.is_won && clientTicketSet.has(Number(p.ticket_number))
            );

            if (won) {
                return NextResponse.json({
                    won: true,
                    prize_amount: won.prize_amount,
                    prize_currency: won.prize_currency,
                    ticket_number: won.ticket_number,
                    winner_name: won.winner_name,
                });
            }
        }

        return NextResponse.json({ won: false });

    } catch (error: any) {
        console.error('[INSTANT WIN CHECK] Error:', error.message || error);
        return NextResponse.json({ won: false, error: 'Internal error' }, { status: 500 });
    }
}
