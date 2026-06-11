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

        // Capturăm succesul din REDIRECT-ul clasic de Checkout (Dacă rămân clienți cu el deschis)
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;
            
            if (session.payment_status === 'paid') {
                const orderId = session.metadata?.orderId;
                
                if (orderId) {
                    console.log(`[STRIPE-WEBHOOK] Checkout Session successful for Order: ${orderId}`);
                    await processPostPayment({ orderId, host, userAgent: 'Stripe Webhook' });
                }
            }
        } 
        // NOU: Capturăm succesul din noul STRIPE ELEMENTS (Plată sigură în site)
        else if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as any;
            const orderId = paymentIntent.metadata?.orderId;
            
            if (orderId) {
                console.log(`[STRIPE-WEBHOOK] Payment Intent successful for Order: ${orderId} via Elements`);
                await processPostPayment({ orderId, host, userAgent: 'Stripe Webhook (Elements)' });
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[STRIPE-WEBHOOK] Fatal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
