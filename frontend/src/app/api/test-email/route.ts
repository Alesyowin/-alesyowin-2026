import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '../../../lib/email';
import { getTranslations } from 'next-intl/server';

export async function GET(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return new Response(null, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Pune email in URL: ?email=adresa@ta.com' }, { status: 400 });
    }

    try {
        console.log(`[TEST-EMAIL] Trimitere test către: ${email}`);
        
        const t = await getTranslations({ locale: 'en', namespace: 'OrderEmail' });
        
        const host = request.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const result = await sendOrderConfirmationEmail({
            to: email,
            customerName: 'Adrian Test',
            orderId: 'TEST-1234',
            totalAmount: '49.99',
            giveawayTitle: 'Test Giveaway Premium',
            tickets: ['001', '042', '100'],
            locale: 'en',
            translations: t,
            baseUrl
        });

        return NextResponse.json({ 
            message: 'Verifică terminalul pentru detalii Resend',
            result: result
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
