import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const giveawayId = searchParams.get('giveawayId');
    const name       = searchParams.get('name')?.trim();

    if (!giveawayId || !name || name.trim().length < 1) {
        return NextResponse.json({ tickets: [] }, { status: 200 });
    }

    const gIdInt = parseInt(giveawayId, 10);

    // Detectăm dacă utilizatorul caută după număr de bilet (șir numeric)
    const ticketNumber = /^\d+$/.test(name) ? parseInt(name, 10) : null;
    
    // Spargem interogarea în cuvinte separate ("Mohamed Abdul" -> ["Mohamed", "Abdul"])
    const terms = name.split(/\s+/).filter(Boolean);

    try {
        let tickets: any[] = [];

        if (ticketNumber !== null) {
            // === Căutare după numărul exact al biletului ===
            // @ts-ignore
            const result = await (adminClient as any).request(
                readItems('tickets' as any, {
                    filter: {
                        _and: [
                            { giveaway_id: { _eq: gIdInt } },
                            { ticket_number: { _eq: ticketNumber } },
                        ]
                    },
                    fields: ['id', 'ticket_number', 'email', 'client_name', 'order_id', 'date_created', 'is_winner', 'prize_won'],
                    limit: 10,
                })
            );
            tickets = result || [];
        } else {
            // === Căutare după Nume sau Email direct în Tickets ===
            // Fiecărui termen i se impune să se regăsească fie în client_name, fie în email
            const termsFilters = terms.map(term => ({
                _or: [
                    { client_name: { _icontains: term } },
                    { email:       { _icontains: term } },
                ]
            }));

            // @ts-ignore
            const result = await (adminClient as any).request(
                readItems('tickets' as any, {
                    filter: {
                        _and: [
                            { giveaway_id: { _eq: gIdInt } },
                            ...termsFilters
                        ]
                    },
                    fields: ['id', 'ticket_number', 'email', 'client_name', 'order_id', 'date_created', 'is_winner', 'prize_won'],
                    limit: 500,
                    sort: ['ticket_number'],
                })
            );
            tickets = result || [];

            // === Fallback: căutare prin Customers (bilete vechi fără client_name) ===
            if (tickets.length === 0) {
                // Fiecărui termen i se impune să se regăsească fie în First_Name, Last_Name sau email
                const customerTermsFilters = terms.map(term => ({
                    _or: [
                        { First_Name: { _icontains: term } },
                        { Last_Name:  { _icontains: term } },
                        { email:      { _icontains: term } },
                    ]
                }));

                // @ts-ignore
                const customers = await (adminClient as any).request(
                    readItems('customers' as any, {
                        filter: {
                            _and: customerTermsFilters
                        },
                        fields: ['email'],
                        limit: 20,
                    })
                );

                if (customers && customers.length > 0) {
                    const emails = [...new Set(customers.map((c: any) => c.email).filter(Boolean))];
                    // @ts-ignore
                    for (const email of emails) {
                        // @ts-ignore
                        const byEmail = await (adminClient as any).request(
                            readItems('tickets' as any, {
                                filter: {
                                    _and: [
                                        { giveaway_id: { _eq: gIdInt } },
                                        { email: { _eq: email } },
                                    ]
                                },
                                fields: ['id', 'ticket_number', 'email', 'client_name', 'order_id', 'date_created', 'is_winner', 'prize_won'],
                                limit: 500,
                                sort: ['ticket_number'],
                            })
                        );
                        if (byEmail && byEmail.length > 0) tickets.push(...byEmail);
                    }
                }
            }
        }

        return NextResponse.json({
            tickets,
            searchedName: name,
            searchType: ticketNumber !== null ? 'ticket_number' : 'name_email',
            count: tickets.length,
        });

    } catch (error: any) {
        console.error('[search-tickets] Error:', error?.errors?.[0]?.message || error?.message);
        return NextResponse.json({ error: 'Error searching for tickets.' }, { status: 500 });
    }
}
