import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { sendBonusWinnerEmail, sendAdminBonusWinnerEmail } from '../../../../lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            secret,
            orderId,
            giveawayId,
            giveawayTitle,
            ticketNumber,
            winnerName,
            winnerEmail,
            winnerPhone,
            locale,
            prizeValue,
            threshold
        } = body;

        // Validare simplă - secretul trebuie să coincidă cu ADMIN_TOKEN-ul nostru
        if (secret !== process.env.DIRECTUS_ADMIN_TOKEN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!winnerEmail || !ticketNumber || !giveawayTitle) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[BONUS-WEBHOOK] Signal received for Bonus Winner: ${winnerName} (#${ticketNumber})`);

        const orderLocale = locale || 'en';
        const host = request.headers.get('host') || 'gpcompetition.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        // 1. Preluăm traducerile
        const t = await getTranslations({ locale: orderLocale, namespace: 'BonusWinnerEmail' });

        // 2. Trimitem email Client
        const clientEmail = await sendBonusWinnerEmail({
            to: winnerEmail,
            customerName: winnerName,
            ticketNumber,
            prizeValue: prizeValue || 'Bonus Prize',
            giveawayTitle,
            translations: t,
            baseUrl
        });

        // 3. Trimitem email Admin
        const adminEmail = await sendAdminBonusWinnerEmail({
            orderId: orderId?.toString() || giveawayId?.toString() || '0',
            customerName: winnerName,
            customerEmail: winnerEmail,
            customerPhone: winnerPhone || 'N/A',
            ticketNumber,
            prizeValue: prizeValue || 'Bonus Prize',
            giveawayTitle,
            threshold: threshold?.toString(),
            baseUrl
        });

        return NextResponse.json({
            success: true,
            clientEmail: clientEmail.success,
            adminEmail: adminEmail.success
        });

    } catch (error: any) {
        console.error('[BONUS-WEBHOOK] Error:', error.message || error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
