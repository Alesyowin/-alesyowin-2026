import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { processPostPayment } from '../../../../lib/post-payment';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature') as string;

        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
        } catch (err: any) {
            console.error(`[STRIPE-WEBHOOK] Error verify signature:`, err.message);
            return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
        }

        const host = request.headers.get('host') || 'alesyowin.com';

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;
            
            if (session.payment_status === 'paid') {
                const orderId = session.metadata?.orderId;
                
                if (orderId) {
                    console.log(`[STRIPE-WEBHOOK] Payment successful for Order: ${orderId}`);
                    
                    await processPostPayment({
                        orderId,
                        host,
                        userAgent: 'Stripe Webhook'
                    });
                } else {
                    console.warn(`[STRIPE-WEBHOOK] Completed session missing orderId in metadata`);
                }
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[STRIPE-WEBHOOK] Fatal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
