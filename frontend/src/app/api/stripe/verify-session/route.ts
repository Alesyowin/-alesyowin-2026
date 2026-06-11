import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { processPostPayment } from '../../../../lib/post-payment';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, paymentIntentId, orderId } = body;

        if ((!sessionId && !paymentIntentId) || !orderId) {
            return NextResponse.json({ error: 'Missing session identifiers or orderId' }, { status: 400 });
        }

        const host = request.headers.get('host') || 'alesyowin.com';

        // 1. Verificare Payment Intent (pentru varianta nouă Stripe Elements)
        if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status === 'succeeded' && paymentIntent.metadata?.orderId === orderId.toString()) {
                const result = await processPostPayment({
                    orderId,
                    host,
                    userAgent: 'Verify Session Fallback (Elements)'
                });

                return NextResponse.json({ 
                    success: true, 
                    status: 'paid',
                    processed: result.success
                });
            }
            return NextResponse.json({ success: true, status: paymentIntent.status });
        }

        // 2. Verificare Checkout Session (pentru varianta veche)
        if (sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid' && session.metadata?.orderId === orderId.toString()) {
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
        }

    } catch (error: any) {
        console.error('[STRIPE-VERIFY] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
