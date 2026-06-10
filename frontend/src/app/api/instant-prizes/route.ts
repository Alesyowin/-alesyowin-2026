import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems } from '@directus/sdk';
import { staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

/**
 * GET /api/instant-prizes?giveawayId=X
 * Returnează lista actuală de instant_prizes pentru un giveaway.
 * Apelat de GiveawayInformation prin polling la fiecare 15 secunde.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const giveawayId = searchParams.get('giveawayId');

        if (!giveawayId) {
            return NextResponse.json({ error: 'Missing giveawayId' }, { status: 400 });
        }

        const result = await (adminClient as any).request(
            readItems('giveaways', {
                filter: { id: { _eq: parseInt(giveawayId, 10) } },
                fields: ['instant_prizes', 'bonus_draws', 'sold_tickets'],
                limit: 1,
            })
        );

        const gw = result?.[0];
        if (!gw) {
            return NextResponse.json({ prizes: [], bonusDraws: [], ticketsSold: 0 });
        }

        // Parsăm instant_prizes
        let prizes: any[] = [];
        if (typeof gw.instant_prizes === 'string') {
            try { prizes = JSON.parse(gw.instant_prizes); } catch { prizes = []; }
        } else if (Array.isArray(gw.instant_prizes)) {
            prizes = gw.instant_prizes;
        }

        // Parsăm bonus_draws
        let bonusDraws: any[] = [];
        if (typeof gw.bonus_draws === 'string') {
            try { bonusDraws = JSON.parse(gw.bonus_draws); } catch { bonusDraws = []; }
        } else if (Array.isArray(gw.bonus_draws)) {
            bonusDraws = gw.bonus_draws;
        }

        const ticketsSold = gw.sold_tickets || 0;

        return NextResponse.json({ prizes, bonusDraws, ticketsSold }, {
            headers: {
                // Nu cache-uim — vrem date proaspete la fiecare polling
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
        });

    } catch (error: any) {
        console.error('[instant-prizes API] Error:', error.message || error);
        return NextResponse.json({ prizes: [] }, { status: 500 });
    }
}
