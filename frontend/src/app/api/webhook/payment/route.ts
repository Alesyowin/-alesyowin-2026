import { NextResponse } from 'next/server';
import { getClientIP } from '../../../lib/rate-limit';
import { processPostPayment } from '../../../lib/post-payment';

const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, secret } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        if (secret !== ADMIN_TOKEN) {
            return NextResponse.json({ error: 'Invalid secret token' }, { status: 403 });
        }

        console.log(`[WEBHOOK-PAYMENT] Manual simulation triggered for Order: ${orderId}`);

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

        return NextResponse.json({ success: true, message: 'Simulation success triggered' });

    } catch (error: any) {
        console.error('[WEBHOOK-PAYMENT] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
