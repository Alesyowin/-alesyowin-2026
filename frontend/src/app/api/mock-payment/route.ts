import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import { getClientIP } from '../../../lib/rate-limit';
import { processPostPayment } from '../../../lib/post-payment';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://alesyowin-backend.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function POST(request: Request) {
    try {
        if (!ADMIN_TOKEN || ADMIN_TOKEN === 'ADAUGA_TOKEN_AICI') {
            return NextResponse.json({ error: 'Missing Server Admin Token' }, { status: 500 });
        }

        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        console.log(`[MOCK-PAYMENT] Validating attempt for Order: ${orderId}`);

        // @ts-ignore
        const order = await adminClient.request(
            readItems('orders' as any, {
                filter: { id: { _eq: parseInt(orderId, 10) } },
                fields: ['Total_Amount'] as any,
                limit: 1,
            })
        );

        if (!order || order.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const amountNum = Number(order[0].Total_Amount);
        if (amountNum > 0) {
            console.error(`[MOCK-PAYMENT] ❌ FRAUD ATTEMPT: Tried to mock-pay an order with value £${amountNum}`);
            return NextResponse.json({ error: 'Security constraint: Cannot bypass payment for non-free orders' }, { status: 403 });
        }

        const host = request.headers.get('host') || 'alesyowin.com';
        const ip = getClientIP(request) || undefined;
        const userAgent = request.headers.get('user-agent') || 'Unknown';

        const result = await processPostPayment({
            orderId,
            host,
            ip,
            userAgent
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Mock payment success triggered' });

    } catch (error: any) {
        console.error('[MOCK-PAYMENT] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
