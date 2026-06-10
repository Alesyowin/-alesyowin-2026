const fs = require('fs');
const processPaymentCode = fs.readFileSync('./src/app/api/process-payment/route.ts', 'utf8');
const emailLogicStart = processPaymentCode.indexOf('        // --- PASUL 3: Plata e aprobata');
const emailLogicEnd = processPaymentCode.indexOf('        // --- RASPUNS FINAL: SUCCES ---');
const emailLogic = processPaymentCode.substring(emailLogicStart, emailLogicEnd);

const beforeLogic = import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createDirectus, rest, readItems, updateItem, staticToken } from '@directus/sdk';
import { getTranslations } from 'next-intl/server';
import { sendOrderConfirmationEmail, sendAdminOrderNotification, sendInstantWinnerEmail, sendAdminInstantWinnerEmail, sendBonusWinnerEmail, sendAdminBonusWinnerEmail } from '../../../lib/email';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;
const PAYTRIOT_SECURITY_KEY = process.env.PAYTRIOT_SECURITY_KEY || '';

const adminClient = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

const phpUrlencode = (str: string): string => {
    return encodeURIComponent(str)
        .replace(/%20/g, '+')
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\\(/g, '%28')
        .replace(/\\)/g, '%29')
        .replace(/\\*/g, '%2A')
        .replace(/~/g, '%7E');
};

export async function POST(request: Request) {
    return handleCallback(request);
}

export async function GET(request: Request) {
    return handleCallback(request);
}

async function handleCallback(request: Request) {
    try {
        console.log('[PAYMENT-CALLBACK] Am primit redirect...');
        let fields: Record<string, string> = {};
        
        const url = new URL(request.url);
        let currentLocale = url.searchParams.get('locale') || 'en';

        if (request.method === 'POST') {
            const formData = await request.formData();
            for (const [key, value] of formData.entries()) {
                fields[key] = value.toString();
            }
        } else {
            console.warn('[PAYMENT-CALLBACK] Redirect GET...');
            for (const [key, value] of url.searchParams.entries()) {
                if (key !== 'locale') {
                    fields[key] = value.toString();
                }
            }
        }

        const responseCode = fields.responseCode || fields.response_code;
        const signature = fields.signature;
        const orderId = fields.transactionUnique || fields.transactionid || url.searchParams.get('orderId');

        if (!orderId) {
            console.error('[PAYMENT-CALLBACK] ? Lipseste orderId');
            return NextResponse.redirect(new URL(\/\/checkout?error=declined\, request.url), 303);
        }

        if (signature && PAYTRIOT_SECURITY_KEY) {
            const fieldsForSig = { ...fields };
            delete fieldsForSig.signature;
            const sortedKeys = Object.keys(fieldsForSig).sort();
            const sortedPairs = sortedKeys.map(key => \\=\\);
            const queryString = sortedPairs.join('&').replace(/%0D%0A|%0A%0D|%0D/g, '%0A');
            const expectedSignature = crypto.createHash('sha512').update(queryString + PAYTRIOT_SECURITY_KEY).digest('hex');

            if (signature !== expectedSignature) {
                console.error('[PAYMENT-CALLBACK] ? Semnatura invalida!');
                return NextResponse.redirect(new URL(\/\/checkout?error=declined\, request.url), 303);
            }
        }

        if (responseCode !== '0') {
            console.warn(\[PAYMENT-CALLBACK] ? Plata REFUZATA! responseCode: \\);
            return NextResponse.redirect(new URL(\/\/checkout?error=declined\, request.url), 303);
        }

        try {
            // @ts-ignore
            const existingOrder = await adminClient.request(readItems('orders' as any, { filter: { id: { _eq: parseInt(orderId, 10) } }, fields: ['status', 'locale'] as any, limit: 1 }));
            if (existingOrder?.[0]) {
                currentLocale = existingOrder[0].locale || currentLocale;
                if (existingOrder[0].status === 'paid') {
                    console.log('[PAYMENT-CALLBACK] Deja PAID.');
                    return NextResponse.redirect(new URL(\/\/success?orderId=\\, request.url), 303);
                }
            }
        } catch(e) {}
        
        const nmiResult = { transactionid: fields.transactionID || fields.xref || 'N/A' };
;

const afterLogic = 
        return NextResponse.redirect(new URL(\/\/success?orderId=\\, request.url), 303);

    } catch (e: any) {
        console.error('[PAYMENT-CALLBACK] Eroare:', e);
        const fbUrl = new URL(request.url);
        const fbLoc = fbUrl.searchParams.get('locale') || 'en';
        return NextResponse.redirect(new URL(\/\/checkout?error=declined\, request.url), 303);
    }
}
;

fs.writeFileSync('./src/app/api/payment-callback/route.ts', beforeLogic + emailLogic + afterLogic);
console.log('Script updated successfully');
