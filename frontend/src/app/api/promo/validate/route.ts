import { NextResponse } from 'next/server';
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://alesyowin-backend.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { promoCode } = body;

        if (!promoCode) {
            return NextResponse.json({ error: 'Promo code is required', valid: false }, { status: 400 });
        }

        // Caută codul în baza de date, insensibil la majuscule/minuscule
        // @ts-ignore
        const codes = await adminClient.request(
            readItems('promo_codes' as any, {
                filter: { code: { _eq: promoCode.trim().toUpperCase() } },
                limit: 1
            })
        );

        if (!codes || codes.length === 0) {
            return NextResponse.json({ valid: false, error: 'Invalid promo code' }, { status: 200 });
        }

        const promo = codes[0];

        // Verifică dacă este activ
        if (!promo.is_active) {
            return NextResponse.json({ valid: false, error: 'Promo code is inactive' }, { status: 200 });
        }

        // Verifică data de expirare (dacă există)
        if (promo.valid_until) {
            const expirationDate = new Date(promo.valid_until);
            if (new Date() > expirationDate) {
                return NextResponse.json({ valid: false, error: 'Promo code has expired' }, { status: 200 });
            }
        }

        // Verifică limita de utilizări (dacă max_uses nu este null)
        if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
            return NextResponse.json({ valid: false, error: 'Promo code usage limit reached' }, { status: 200 });
        }

        return NextResponse.json({
            valid: true,
            id: promo.id,
            code: promo.code,
            discount_percentage: promo.discount_percentage
        }, { status: 200 });

    } catch (error: any) {
        console.error('[PROMO-VALIDATE] Error:', error);
        return NextResponse.json({ error: 'Server error', valid: false }, { status: 500 });
    }
}
