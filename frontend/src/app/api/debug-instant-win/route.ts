import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems } from '@directus/sdk';
import { staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

/**
 * Rută de diagnosticare pentru Instant Win.
 * Apelează cu: GET /api/debug-instant-win?orderId=X
 * Afișează exact ce vede webhook-ul: bilete generate, instant_prizes, și dacă se potrivesc.
 */
export async function GET(request: Request) {
    // Blocare în producție — ruta de debug nu trebuie să fie accesibilă public
    if (process.env.NODE_ENV === 'production') {
        return new Response(null, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        return NextResponse.json({ error: 'Parametru orderId lipsește' }, { status: 400 });
    }

    const report: Record<string, any> = { orderId, steps: [] };

    try {
        // PASUL A: Citim biletele din tabelul 'tickets' filtrate pe order_id
        const tickets = await (adminClient as any).request(
            readItems('tickets', {
                filter: { order_id: { _eq: parseInt(orderId, 10) } },
                fields: ['id', 'ticket_number', 'giveaway_id', 'client_name', 'order_id'],
                limit: 200,
            })
        );

        report.steps.push({
            step: 'A - Bilete găsite în DB pentru order_id',
            count: tickets?.length || 0,
            data: tickets || [],
            issue: !tickets || tickets.length === 0
                ? '⚠️ PROBLEMĂ: Nu există bilete cu acest order_id! Hook-ul nu a salvat order_id pe bilete, sau nu a rulat.'
                : '✅ Bilete găsite.'
        });

        if (!tickets || tickets.length === 0) {
            return NextResponse.json(report);
        }

        // Extragem numerele de bilete și giveaway-urile
        const ticketNumbers = tickets.map((t: any) => Number(t.ticket_number));
        const giveawayIds = [...new Set(tickets.map((t: any) => String(t.giveaway_id)))];

        report.ticketNumbers = ticketNumbers;
        report.giveawayIds = giveawayIds;

        // PASUL B: Citim instant_prizes pentru fiecare giveaway
        for (const giveawayId of giveawayIds) {
            const giveawayArr = await (adminClient as any).request(
                readItems('giveaways', {
                    filter: { id: { _eq: parseInt(giveawayId, 10) } },
                    fields: ['id', 'instant_prizes', 'sold_tickets'],
                    limit: 1,
                })
            );
            const gw = giveawayArr?.[0];

            const gwReport: Record<string, any> = {
                step: `B - instant_prizes pentru giveaway ${giveawayId}`,
                raw_instant_prizes: gw?.instant_prizes,
                type_of_instant_prizes: typeof gw?.instant_prizes,
                is_array: Array.isArray(gw?.instant_prizes),
                sold_tickets: gw?.sold_tickets,
            };

            if (!gw?.instant_prizes) {
                gwReport.issue = '⚠️ PROBLEMĂ: instant_prizes este null sau lipsă pe giveaway!';
                report.steps.push(gwReport);
                continue;
            }

            // PASUL C: Parsăm instant_prizes
            let prizes: any[] = [];
            if (typeof gw.instant_prizes === 'string') {
                try {
                    prizes = JSON.parse(gw.instant_prizes);
                    gwReport.parse_note = 'A fost string JSON, s-a parsat cu succes.';
                } catch (e) {
                    gwReport.issue = `⚠️ PROBLEMĂ: instant_prizes este string dar NU e JSON valid! Valoare: ${gw.instant_prizes}`;
                    report.steps.push(gwReport);
                    continue;
                }
            } else if (Array.isArray(gw.instant_prizes)) {
                prizes = gw.instant_prizes;
                gwReport.parse_note = 'A venit deja ca array (cast-json funcționează).';
            } else {
                gwReport.issue = `⚠️ PROBLEMĂ: instant_prizes are un tip neașteptat: ${typeof gw.instant_prizes}`;
                report.steps.push(gwReport);
                continue;
            }

            gwReport.prizes_parsed = prizes;
            gwReport.prizes_count = prizes.length;

            // PASUL D: Comparăm numerele de bilete cu instant_prizes
            const clientTicketSet = new Set(ticketNumbers);
            const matches: any[] = [];
            const nonMatches: any[] = [];

            for (const prize of prizes) {
                const prizeTicketNum = Number(prize.ticket_number);
                const matched = clientTicketSet.has(prizeTicketNum);

                if (matched) {
                    matches.push({
                        ticket_number: prize.ticket_number,
                        prize_amount: prize.prize_amount,
                        is_won: prize.is_won,
                        issue: prize.is_won ? '⚠️ Deja marcat câștigat (is_won: true) — probabil s-a procesat înainte' : '✅ POTRIVIRE GĂSITĂ — trebuia să triggere câștig!'
                    });
                } else {
                    nonMatches.push({
                        ticket_number: prize.ticket_number,
                        prize_ticket_number_as_number: prizeTicketNum,
                        client_ticket_numbers: ticketNumbers,
                        reason: `Numărul ${prizeTicketNum} nu se regăsește în biletele clientului: [${ticketNumbers.join(', ')}]`
                    });
                }
            }

            gwReport.matches_found = matches;
            gwReport.non_matches = nonMatches;

            if (matches.length === 0) {
                gwReport.conclusion = `⚠️ CONCLUZIE: Nicio potrivire! Biletele clientului (${ticketNumbers.join(', ')}) nu includ niciunul din numerele din instant_prizes (${prizes.map((p: any) => p.ticket_number).join(', ')}).`;
            } else {
                gwReport.conclusion = `✅ CONCLUZIE: ${matches.length} potrivire(i) găsite!`;
            }

            report.steps.push(gwReport);
        }

    } catch (err: any) {
        report.error = err?.message || String(err);
    }

    return NextResponse.json(report, { status: 200 });
}
