import { Resend } from 'resend';
import { getOrderEmailTemplate } from './order-email-template';
import { getAdminOrderEmailTemplate, AdminOrderProduct } from './admin-email-template';
import { getInstantWinnerEmailTemplate, InstantOrderEmailProps } from './instant-winner-email-template';
import { getAdminInstantEmailTemplate, AdminInstantOrderEmailProps } from './admin-instant-email-template';
import { getBonusWinnerEmailTemplate, BonusOrderEmailProps } from './bonus-winner-email-template';
import { getAdminBonusWinnerTemplate, AdminBonusEmailProps } from './admin-bonus-email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
    to,
    subject,
    text,
    html
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Alesyowin <noreply@alesyowin.uk>',
            to,
            subject,
            text,
            html: html || text,
        });

        if (error) {
            console.error('[Resend Error]:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('[Email Utility Error]:', error);
        return { success: false, error };
    }
}

/**
 * Trimite email-ul de confirmare a comenzii cu designul stilizat
 */
export async function sendOrderConfirmationEmail(options: {
    to: string;
    customerName: string;
    orderId: string;
    totalAmount: string;
    products: {
        giveawayTitle: string;
        productImageUrl?: string;
        tickets: string[];
    }[];
    locale: string;
    translations: any;
    baseUrl: string;
}) {
    const { to, customerName, orderId, totalAmount, products, locale, translations, baseUrl } = options;
    const t = translations;

    // Forțăm logo-ul de pe serverul de producție pentru testele de pe localhost
    const isLocalhost = baseUrl.includes('localhost');
    const logoUrl = isLocalhost 
        ? 'https://ALESYOWIN.com/logo-principal-orizontal-fara-fundal.png' 
        : `${baseUrl}/logo-principal-orizontal-fara-fundal.png`;

    const html = getOrderEmailTemplate({
        orderId,
        customerName,
        totalAmount,
        products,
        title: t('title'),
        greeting: t('greeting', { name: customerName }),
        orderNumberLabel: t('orderNumber'),
        eventLabel: t('event'),
        totalLabel: t('total'),
        yourTicketsLabel: t('yourTickets'),
        thanksMessage: t('thanks'),
        footer: t('footer', { year: new Date().getFullYear().toString() }),
        logoUrl
    });

    return sendEmail({
        to,
        subject: t('subject', { id: orderId }),
        text: `${t('title')} #${orderId}`,
        html
    });
}

/**
 * Trimite emailul de notificare admin la comandă nouă.
 * Complet independent de emailul trimis către client.
 * Destinatar fix: ALESYOWINn@gmail.com
 */
export async function sendAdminOrderNotification(options: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    products: AdminOrderProduct[];
    totalAmount: string;
    baseUrl: string;
}) {
    const { orderId, customerName, customerEmail, customerPhone, customerAddress, products, totalAmount, baseUrl } = options;

    // Construim URL-ul spre panoul de admin Directus
    const directusUrl = process.env.DIRECTUS_URL || 'https://ALESYOWIN.onrender.com';
    const directusAdminUrl = `${directusUrl}/admin/content/orders/${orderId}`;

    // Logo-ul — forțăm producție dacă suntem pe localhost
    const isLocalhost = baseUrl.includes('localhost');
    const logoUrl = isLocalhost
        ? 'https://ALESYOWIN.com/logo-principal-orizontal-fara-fundal.png'
        : `${baseUrl}/logo-principal-orizontal-fara-fundal.png`;

    // Formatăm data și ora curentă
    const now = new Date();
    const orderDate = now.toLocaleDateString('ro-RO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Bucharest'
    });

    // Calculăm subtotalul din produse
    const subtotalNum = products.reduce((sum, p) => sum + p.lineTotal, 0);
    const subtotal = subtotalNum.toFixed(2);
    const total = Number(totalAmount).toFixed(2);

    // Generăm HTML-ul folosind template-ul dedicat admin
    const html = getAdminOrderEmailTemplate({
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        orderDate,
        products,
        subtotal,
        total,
        directusAdminUrl,
        logoUrl,
    });

    // Subiectul emailului conform specificațiilor
    const subject = `[Comandă Nouă] Comanda #${orderId} plasată de ${customerName}`;

    return sendEmail({
        to: process.env.ADMIN_EMAIL || 'andreialexandruuk25@gmail.com',
        subject,
        text: `Comandă nouă #${orderId} de la ${customerName} (${customerEmail}). Total: £${total}`,
        html
    });
}

/**
 * Trimite email-ul dedicat unui Câștigător Instant
 */
export async function sendInstantWinnerEmail(options: {
    to: string;
    customerName: string;
    ticketNumber: string | number;
    prizeValue: string;
    giveawayTitle: string;
    translations: any;
    baseUrl: string;
}) {
    const { to, customerName, ticketNumber, prizeValue, giveawayTitle, translations, baseUrl } = options;
    const t = translations;

    // Forțăm logo-ul de pe serverul de producție pentru testele de pe localhost
    const isLocalhost = baseUrl.includes('localhost');
    const logoUrl = isLocalhost 
        ? 'https://ALESYOWIN.com/logo-principal-orizontal-fara-fundal.png' 
        : `${baseUrl}/logo-principal-orizontal-fara-fundal.png`;

    const html = getInstantWinnerEmailTemplate({
        customerName,
        ticketNumber,
        prizeValue,
        giveawayTitle,
        title: t('title'),
        greeting: t('greeting', { name: customerName }),
        congrats: t('congrats', { title: giveawayTitle }),
        ticketLabel: t('ticketLabel'),
        prizeLabel: t('prizeLabel'),
        instructions: t('instructions'),
        thanks: t('thanks'),
        footer: t('footer', { year: new Date().getFullYear().toString() }),
        logoUrl
    });

    return sendEmail({
        to,
        subject: t('subject', { title: giveawayTitle }),
        text: `${t('title')} - ${giveawayTitle}`,
        html
    });
}

/**
 * Trimite notificare Admin cand e un Instant Winner
 */
export async function sendAdminInstantWinnerEmail(options: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    ticketNumber: string | number;
    prizeValue: string;
    giveawayTitle: string;
    baseUrl: string;
}) {
    const { orderId, customerName, customerEmail, customerPhone, ticketNumber, prizeValue, giveawayTitle, baseUrl } = options;

    const directusUrl = process.env.DIRECTUS_URL || 'https://ALESYOWIN.onrender.com';
    const directusAdminUrl = `${directusUrl}/admin/content/orders/${orderId}`;

    const html = getAdminInstantEmailTemplate({
        customerName,
        customerEmail,
        customerPhone,
        ticketNumber,
        prizeValue,
        giveawayTitle,
        orderId,
        directusAdminUrl
    });

    const subject = `[INSTANT WIN] Câștigător Nou - Comanda #${orderId}`;

    return sendEmail({
        to: process.env.ADMIN_EMAIL || 'andreialexandruuk25@gmail.com',
        subject,
        text: `A câștigat ${customerName} premiul ${prizeValue} la concursul ${giveawayTitle} cu biletul ${ticketNumber}.`,
        html
    });
}

/**
 * Trimite email-ul dedicat unui Câștigător Bonus Draw
 */
export async function sendBonusWinnerEmail(options: {
    to: string;
    customerName: string;
    ticketNumber: string | number;
    prizeValue: string;
    giveawayTitle: string;
    translations: any;
    baseUrl: string;
}) {
    const { to, customerName, ticketNumber, prizeValue, giveawayTitle, translations, baseUrl } = options;
    const t = translations;

    const isLocalhost = baseUrl.includes('localhost');
    const logoUrl = isLocalhost 
        ? 'https://ALESYOWIN.com/logo-principal-orizontal-fara-fundal.png' 
        : `${baseUrl}/logo-principal-orizontal-fara-fundal.png`;

    const html = getBonusWinnerEmailTemplate({
        customerName,
        ticketNumber,
        prizeValue,
        giveawayTitle,
        title: t('title'),
        greeting: t('greeting', { name: customerName }),
        congrats: t('congrats', { title: giveawayTitle }),
        ticketLabel: t('ticketLabel'),
        prizeLabel: t('prizeLabel'),
        instructions: t('instructions'),
        thanks: t('thanks'),
        footer: t('footer', { year: new Date().getFullYear().toString() }),
        logoUrl
    });

    return sendEmail({
        to,
        subject: t('subject', { title: giveawayTitle }),
        text: `${t('title')} - ${giveawayTitle}`,
        html
    });
}

/**
 * Trimite notificare Admin cand e un Bonus Draw Winner
 */
export async function sendAdminBonusWinnerEmail(options: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    ticketNumber: string | number;
    prizeValue: string;
    giveawayTitle: string;
    threshold?: string;
    baseUrl: string;
}) {
    const { orderId, customerName, customerEmail, customerPhone, ticketNumber, prizeValue, giveawayTitle, threshold, baseUrl } = options;

    const html = getAdminBonusWinnerTemplate({
        customerName,
        customerEmail,
        customerPhone,
        ticketNumber,
        prizeValue,
        giveawayTitle,
        orderId,
        threshold,
        baseUrl
    });

    const subject = `[BONUS DRAW WIN] Câștigător Nou Extras Automat - ${customerName}`;

    return sendEmail({
        to: process.env.ADMIN_EMAIL || 'andreialexandruuk25@gmail.com',
        subject,
        text: `A fost extras automat biletul #${ticketNumber} (${customerName}) pentru premiul ${prizeValue} la concursul ${giveawayTitle}.`,
        html
    });
}
