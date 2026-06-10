import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';
import { rateLimit, getClientIP } from '../../../lib/rate-limit';

// Câmpuri de configurare Paytriot preluate din variabilele de mediu
const PAYTRIOT_MERCHANT_ID = process.env.PAYTRIOT_MERCHANT_ID || '289347';
const PAYTRIOT_SECURITY_KEY = process.env.PAYTRIOT_SECURITY_KEY || '';

/**
 * Dicționar care mapează numele țării (scris liber de utilizator) la codul ISO 3166-1 alpha-2.
 * Acoperim țările cele mai comune pentru clienții noștri.
 */
const COUNTRY_TO_ISO: Record<string, CountryCode> = {
    // Engleză / abrevieri comune
    'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
    'romania': 'RO', 'românia': 'RO',
    'germany': 'DE', 'deutschland': 'DE', 'germania': 'DE',
    'france': 'FR', 'franța': 'FR', 'franţa': 'FR',
    'italy': 'IT', 'italia': 'IT',
    'spain': 'ES', 'spania': 'ES', 'españa': 'ES',
    'united states': 'US', 'usa': 'US', 'us': 'US',
    'poland': 'PL', 'polonia': 'PL',
    'hungary': 'HU', 'ungaria': 'HU',
    'bulgaria': 'BG',
    'czech republic': 'CZ', 'czechia': 'CZ',
    'slovakia': 'SK',
    'austria': 'AT',
    'netherlands': 'NL', 'holland': 'NL', 'olanda': 'NL',
    'belgium': 'BE', 'belgia': 'BE',
    'sweden': 'SE', 'suedia': 'SE',
    'norway': 'NO', 'norvegia': 'NO',
    'denmark': 'DK', 'danemarca': 'DK',
    'finland': 'FI', 'finlanda': 'FI',
    'portugal': 'PT',
    'greece': 'GR', 'grecia': 'GR',
    'croatia': 'HR', 'croația': 'HR',
    'serbia': 'RS',
    'moldova': 'MD',
    'ukraine': 'UA', 'ucraina': 'UA',
    'ireland': 'IE', 'irlanda': 'IE',
    'australia': 'AU',
    'canada': 'CA',
};

/**
 * Convertă un număr de telefon în format internațional E.164 (+XXXXXXXXXXX).
 * Gestionează corect:
 *   - Numere care au deja + (rămân nemodificate)
 *   - Numere locale care încep cu 0 (ex: 0728... → +40728...)
 *   - Numere în format național fără 0 (parsate cu context de țară)
 */
function normalizePhoneNumber(phone: string, countryInput: string): string {
    if (!phone?.trim()) return phone;

    const trimmed = phone.trim();

    // Dacă numărul are deja prefix internațional, îl folosim ca atare
    if (trimmed.startsWith('+')) {
        return trimmed;
    }

    // Determinăm codul ISO al țării din textul introdus de utilizator
    const countryKey = (countryInput || '').trim().toLowerCase();
    const isoCode: CountryCode = COUNTRY_TO_ISO[countryKey] || 'GB'; // fallback GB (piața primară)

    try {
        const parsed = parsePhoneNumberFromString(trimmed, isoCode);
        if (parsed && parsed.isValid()) {
            const formatted = parsed.format('E.164'); // ex: +40728565856
            console.log(`[PAYMENT-FORM] Tel convertit: "${trimmed}" (${isoCode}) → "${formatted}"`);
            return formatted;
        }
    } catch (e) {
        console.warn(`[PAYMENT-FORM] Eroare conversie telefon:`, e);
    }

    // Fallback: trimitem numărul original dacă conversia eșuează
    console.warn(`[PAYMENT-FORM] Telefon netransformat (fallback): "${trimmed}" pentru țara "${countryInput}"`);
    return trimmed;
}

export async function POST(request: Request) {
    // Protecție anti-spam: maximum 10 cereri pe minut per IP
    const clientIP = getClientIP(request);
    if (!rateLimit(clientIP, 10)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const {
            orderId,
            amount,
            redirectURL,
            // Câmpuri opționale pentru pre-completarea paginii de plată Paytriot
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            customerPostcode,
            customerCountry, // Folosită pentru conversia telefonului — nu se trimite la Paytriot
        } = body;

        // Validare date primite
        if (!orderId || amount === undefined || !redirectURL) {
            return NextResponse.json(
                { error: 'Lipsesc câmpuri obligatorii: orderId, amount, redirectURL' },
                { status: 400 }
            );
        }

        if (!PAYTRIOT_SECURITY_KEY) {
            console.error('[PAYMENT-FORM] Lipsește PAYTRIOT_SECURITY_KEY din variabilele de mediu');
            return NextResponse.json(
                { error: 'Payment gateway not configured' },
                { status: 500 }
            );
        }

        // Suma în pence (ex: £5.99 → 599)
        const amountInPence = Math.round(amount * 100).toString();

        // Câmpurile obligatorii pentru Hosted Payment Page Paytriot
        const fields: Record<string, string> = {
            merchantID: PAYTRIOT_MERCHANT_ID,
            action: 'SALE',
            amount: amountInPence,
            currencyCode: '826',
            countryCode: '826',
            redirectURL: redirectURL,
            transactionUnique: orderId.toString(),
            statementNarrative1: 'Paytrio*Ukcomp',
            statementNarrative2: '02038841611',
        };

        // Adăugăm câmpurile opționale ale clientului — DOAR dacă au valoare
        // Acestea pre-completează formularul Paytriot și sunt incluse automat în semnătură
        // (ordinea nu contează — sortarea alfabetică de la semnătură le ordoneză corect)
        if (customerName?.trim())     fields['customerName']     = customerName.trim();
        if (customerEmail?.trim())    fields['customerEmail']    = customerEmail.trim();
        if (customerAddress?.trim())  fields['customerAddress']  = customerAddress.trim();
        if (customerPostcode?.trim()) fields['customerPostcode'] = customerPostcode.trim();

        // Telefon: convertăm înainte de a-l pune în fields (și în semnătură)
        if (customerPhone?.trim()) {
            fields['customerPhone'] = normalizePhoneNumber(customerPhone, customerCountry || '');
        }

        // === Calcul semnătură SHA-512 (compatibil 100% cu PHP-ul Paytriot/Cardstream) ===
        // Gateway-ul verifică semnătura folosind PHP urlencode — trebuie să-l emulăm exact
        // Diferența critică: encodeURIComponent din JS NU codifică * ! ~ ' ( )
        // dar PHP urlencode le codifică pe TOATE ca %2A %21 %7E %27 %28 %29
        // Exemplu: "Paytrio*Ukcomp" → JS: "Paytrio*Ukcomp" vs PHP: "Paytrio%2AUkcomp"

        // Funcție care emulează exact PHP urlencode()
        const phpUrlencode = (str: string): string => {
            return encodeURIComponent(str)
                .replace(/%20/g, '+')      // Spații ca + (nu %20 ca în JS)
                .replace(/!/g, '%21')      // ! trebuie codat
                .replace(/'/g, '%27')      // ' trebuie codat
                .replace(/\(/g, '%28')     // ( trebuie codat
                .replace(/\)/g, '%29')     // ) trebuie codat
                .replace(/\*/g, '%2A')     // * trebuie codat — CRITIC pentru Paytrio*Ukcomp
                .replace(/~/g, '%7E');     // ~ trebuie codat
        };

        // Sortăm câmpurile alfabetic și construim query-string-ul identic cu PHP http_build_query
        const sortedKeys = Object.keys(fields).sort();
        const sortedPairs = sortedKeys.map(key =>
            `${phpUrlencode(key)}=${phpUrlencode(fields[key])}`
        );
        const queryString = sortedPairs.join('&');

        // Normalizare line endings (identic cu codul sursă Cardstream/Paytriot)
        const normalizedQuery = queryString
            .replace(/%0D%0A|%0A%0D|%0D/g, '%0A');

        // Concatenăm cheia secretă la final FĂRĂ separator și aplicăm SHA-512
        const signature = crypto
            .createHash('sha512')
            .update(normalizedQuery + PAYTRIOT_SECURITY_KEY)
            .digest('hex');

        // Adăugăm semnătura la câmpuri
        fields.signature = signature;

        console.log(`[PAYMENT-FORM] Câmpuri semnate generate pentru Order #${orderId}, suma: ${amountInPence} pence`);
        console.log(`[PAYMENT-FORM] Query-string folosit la semnătură: ${normalizedQuery}`);
        console.log(`[PAYMENT-FORM] Semnătura SHA-512: ${signature}`);

        return NextResponse.json({ fields });

    } catch (error: any) {
        console.error('[PAYMENT-FORM] Eroare la generare câmpuri:', error.message);
        return NextResponse.json(
            { error: 'Failed to generate payment form data' },
            { status: 500 }
        );
    }
}
