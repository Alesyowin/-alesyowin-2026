const fs = require('fs');
const processPaymentCode = fs.readFileSync('./src/app/api/process-payment/route.ts', 'utf8');

const emailStartStr = '        // --- PASUL 3: Plata e aprobată';
const emailEndStr = '        // --- RĂSPUNS FINAL: SUCCES ---';

const emailLogicStart = processPaymentCode.indexOf(emailStartStr);
const emailLogicEnd = processPaymentCode.indexOf(emailEndStr);
const emailLogic = processPaymentCode.substring(emailLogicStart, emailLogicEnd);

const beforeLogic = `import { NextResponse } from 'next/server';
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
        console.log('[PAYMENT-CALLBACK] Am primit redirect de la Paytriot...');
        let fields: Record<string, string> = {};
        
        const url = new URL(request.url);
        let currentLocale = url.searchParams.get('locale') || 'en';

        if (request.method === 'POST') {
            const formData = await request.formData();
            for (const [key, value] of formData.entries()) {
                fields[key] = value.toString();
            }
        } else {
            console.warn('[PAYMENT-CALLBACK] Avertisment: redirectul s-a facut prin GET, incercam preluarea url parameters.');
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
            console.error('[PAYMENT-CALLBACK] ❌ Lipseste orderId din date.');
            return NextResponse.redirect(new URL('/' + currentLocale + '/checkout?error=declined', request.url), 303);
        }

        if (signature && PAYTRIOT_SECURITY_KEY) {
            const fieldsForSig = { ...fields };
            delete fieldsForSig.signature;
            const sortedKeys = Object.keys(fieldsForSig).sort();
            const sortedPairs = sortedKeys.map(key => \`\${phpUrlencode(key)}=\${phpUrlencode(fieldsForSig[key])}\`);
            const queryString = sortedPairs.join('&').replace(/%0D%0A|%0A%0D|%0D/g, '%0A');
            const expectedSignature = crypto.createHash('sha512').update(queryString + PAYTRIOT_SECURITY_KEY).digest('hex');

            if (signature !== expectedSignature) {
                console.error('[PAYMENT-CALLBACK] ❌ Semnatura invalida! Expected ' + expectedSignature + ' got ' + signature);
                return NextResponse.redirect(new URL('/' + currentLocale + '/checkout?error=invalid_signature', request.url), 303);
            }
        }

        // Cardstream/Paytriot Hosted trimite responseCode === '0' pentru APROBAT
        if (responseCode !== '0') {
            console.warn('[PAYMENT-CALLBACK] ❌ Plata REFUZATA! responseCode:', responseCode, 'Message:', fields.responseMessage || fields.message);
            // Redirectionam inapoi la pagina de checkout cu un parametru de eroare.
            return NextResponse.redirect(new URL('/' + currentLocale + '/checkout?paymentError=declined', request.url), 303);
        }

        // PROCESARE COMANDĂ APROBATĂ
        console.log('[PAYMENT-CALLBACK] ✅ Plata APROBATA pentru comanda #' + orderId);

        try {
            // @ts-ignore
            const existingOrder = await adminClient.request(readItems('orders' as any, { filter: { id: { _eq: parseInt(orderId, 10) } }, fields: ['status', 'locale'] as any, limit: 1 }));
            if (existingOrder?.[0]) {
                currentLocale = existingOrder[0].locale || currentLocale;
                if (existingOrder[0].status === 'paid') {
                    console.log('[PAYMENT-CALLBACK] Comanda #'+orderId+' este deja PAID in DB (probabil refresh). Redirectare imediata succes.');
                    return NextResponse.redirect(new URL('/' + currentLocale + '/success?orderId=' + orderId, request.url), 303);
                }
            }
        } catch(e) {
            console.warn('Verificare comanda DB fail:', e);
        }
        
        let nmiResult = { transactionid: fields.transactionID || fields.xref || 'N/A' };
`;

const afterLogic = `
        return NextResponse.redirect(new URL('/' + currentLocale + '/success?orderId=' + orderId, request.url), 303);

    } catch (e: any) {
        console.error('[PAYMENT-CALLBACK] Eroare:', e);
        const fbUrl = new URL(request.url);
        const fbLoc = fbUrl.searchParams.get('locale') || 'en';
        return NextResponse.redirect(new URL('/' + fbLoc + '/checkout?paymentError=internal', request.url), 303);
    }
}
`;

fs.writeFileSync('./src/app/api/payment-callback/route.ts', beforeLogic + emailLogic + afterLogic);
console.log('Script updated successfully - Route API generated');
