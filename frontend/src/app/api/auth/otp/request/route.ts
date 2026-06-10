import { NextResponse } from 'next/server';
import { createDirectus, rest, createItem, staticToken } from '@directus/sdk';
import { getTranslations } from 'next-intl/server';
import { sendEmail } from '../../../../../lib/email';
import { getOtpEmailTemplate } from '../../../../../lib/email-template';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

export async function POST(request: Request) {
    try {
        const { email, locale = 'en' } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Email invalid' }, { status: 400 });
        }

        // Preluăm traducerile pentru e-mail bazat pe limba utilizatorului
        const t = await getTranslations({ locale, namespace: 'Email' });

        // Generăm codul de 6 cifre
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minute

        const client = createDirectus(DIRECTUS_URL)
            .with(staticToken(ADMIN_TOKEN!))
            .with(rest());

        // Salvăm în auth_codes
        await client.request(
            createItem('auth_codes', {
                email: email.toLowerCase(),
                debug_code: code,
                expires_at: expiresAt,
                used: false,
                attempts: 0
            })
        );

        // Pregătim datele pentru e-mailul stilizat
        const host = request.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;
        // Forțăm logo-ul de pe serverul de producție pentru testele de pe localhost
        const logoUrl = host?.includes('localhost') 
            ? 'https://gpcompetition.com/logo-principal-orizontal-fara-fundal.png' 
            : `${baseUrl}/logo-principal-orizontal-fara-fundal.png`;

        const html = getOtpEmailTemplate({
            code,
            title: t('otpTitle'),
            greeting: t('otpGreeting'),
            message: t('otpMessage'),
            expiry: t('otpExpiry'),
            securityNote: t('otpSecurityNote'),
            footer: t('footer', { year: new Date().getFullYear().toString() }),
            logoUrl
        });

        // Trimitem emailul via Resend
        const { success, error } = await sendEmail({
            to: email,
            subject: t('otpSubject'),
            text: `${t('otpMessage')} ${code}`, // Fallback text
            html
        });

        if (!success) {
            console.error('[API OTP Request] Resend failed:', error);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API OTP Request] Error:', error);
        return NextResponse.json({ error: 'Eroare la generarea codului' }, { status: 500 });
    }
}
