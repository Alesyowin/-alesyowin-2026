import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { processPostPayment } from '../../../../lib/post-payment';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, orderId } = body;

        if (!sessionId || !orderId) {
            return NextResponse.json({ error: 'Missing sessionId or orderId' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid' && session.metadata?.orderId === orderId.toString()) {
            
            const host = request.headers.get('host') || 'alesyowin.com';
            
            const result = await processPostPayment({
                orderId,
                host,
                userAgent: 'Verify Session Fallback'
            });

            return NextResponse.json({ 
                success: true, 
                status: 'paid',
                processed: result.success
            });
        }

        return NextResponse.json({ success: true, status: session.payment_status });

    } catch (error: any) {
        console.error('[STRIPE-VERIFY] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
