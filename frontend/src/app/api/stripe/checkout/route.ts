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

        // @ts-ignore
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
            return NextResponse.json({ error: 'Invalid amount for Stripe checkout' }, { status: 400 });
        }

        // Calculează prețul în pence pentru Stripe
        const amountInPence = Math.round(amountNum * 100);

        const host = request.headers.get('host') || 'alesyowin.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;
        const locale = orderData.locale || 'en';

        // Creare Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: orderData.client_email || undefined,
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: `Alesyowin Tickets - Order #${orderId}`,
                        },
                        unit_amount: amountInPence,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata: {
                orderId: orderId.toString(),
            },
            success_url: `${baseUrl}/${locale}/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/${locale}/checkout?paymentError=cancelled`,
        });

        if (!session.url) {
            throw new Error('Nu s-a putut genera URL-ul de Checkout');
        }

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('[STRIPE-CHECKOUT] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
