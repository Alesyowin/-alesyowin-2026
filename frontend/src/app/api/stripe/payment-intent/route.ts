import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import { stripe } from '../../../../lib/stripe';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://alesyowin-backend.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Preia detaliile comenzii pentru calcularea corectă a sumei
        const order = await adminClient.request(
            readItems('orders' as any, {
                filter: { id: { _eq: parseInt(orderId, 10) } },
                fields: ['id', 'client_email', 'Total_Amount', 'locale', 'status'] as any,
                limit: 1,
            })
        );

        if (!order || order.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const orderData = order[0];

        if (orderData.status !== 'pending') {
            return NextResponse.json({ error: 'Order is not pending' }, { status: 400 });
        }

        const amountNum = Number(orderData.Total_Amount);
        if (amountNum <= 0) {
            return NextResponse.json({ error: 'Invalid amount for Stripe' }, { status: 400 });
        }

        // Stripe lucrează mereu în unități minime (ex. pence pentru GBP)
        const amountInPence = Math.round(amountNum * 100);

        // Creăm intenția de plată (Stripe Elements) în loc de o sesiune de checkout cu redirect
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPence,
            currency: 'gbp',
            receipt_email: orderData.client_email || undefined,
            metadata: {
                orderId: orderId.toString(),
            },
        });

        if (!paymentIntent.client_secret) {
            throw new Error('Nu s-a putut genera Payment Intent Secret-ul necesar clientului.');
        }

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });

    } catch (error: any) {
        console.error('[STRIPE-PAYMENT-INTENT] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
