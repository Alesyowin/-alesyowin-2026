import crypto from 'crypto';

const PIXEL_CODE = process.env.TIKTOK_PIXEL_ID || 'D7HB3NJC77U9I9C34RGG';
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '7440f7e26b302a8ef09dd862ed8bb325620b7f49';

const hashSHA256 = (str: string) => {
    if (!str) return undefined;
    return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');
};

export interface TikTokEventPayload {
    event: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'CompletePayment';
    ip?: string;
    userAgent?: string;
    url?: string;
    email?: string;
    phone?: string;
    properties: {
        contents?: any[];
        currency?: string;
        value?: number;
    };
}

export const sendTikTokServerEvent = async (payload: TikTokEventPayload) => {
    // ARHITECTURĂ DE SIGURANȚĂ EXTREMĂ (FIRE AND FORGET S2S):
    // Orice eroare așterne în liniște, fără aruncare externă ('throw') pentru a nu afecta checkout-ul funcțional.
    try {
        if (!PIXEL_CODE || !ACCESS_TOKEN) return;

        // Construim payload-ul TikTok CAPI. Adresele utilizatorilor sunt criptate SHA256 in conformitate cu legislatia de date
        const eventData = {
            pixel_code: PIXEL_CODE,
            event: payload.event,
            event_id: crypto.randomUUID(),
            event_time: Math.floor(Date.now() / 1000),
            context: {
                page: {
                    url: payload.url || 'https://gpcompetition.com',
                },
                user: {
                    user_agent: payload.userAgent || 'Unknown',
                    ip: payload.ip || '127.0.0.1'
                }
            },
            user: {
                email: payload.email ? hashSHA256(payload.email) : undefined,
                phone: payload.phone ? hashSHA256(payload.phone) : undefined,
            },
            properties: {
                contents: payload.properties.contents || [],
                currency: payload.properties.currency || 'GBP',
                value: payload.properties.value || 0
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout strictly.

        const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/pixel/track/', {
            method: 'POST',
            headers: {
                'Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorText = await res.text();
            console.warn(`[TikTok S2S] Server Warning on Event ${payload.event}: HTTP ${res.status}`, errorText);
        } else {
            console.log(`[TikTok S2S] Successfully sent event to TikTok: ${payload.event}`);
        }
    } catch (e: any) {
        if (e.name === 'AbortError') {
            console.warn(`[TikTok S2S] Request taking too long for event ${payload.event}. Task silently aborted to protect server loop.`);
        } else {
            console.warn(`[TikTok S2S] Exception during TikTok request logic. Task silently ignored.`, e?.message);
        }
    }
};

/**
 * FIRE AND FORGET Async Wrapper.
 * Apelează funcția principală asincron fără a bloca script-ul părinte.
 */
export const fireTikTokEvent = (payload: TikTokEventPayload) => {
    // Desprindem din thread-ul Node curent - serverul nu va intârzia checkoutul real in a-l aştepta
    setTimeout(() => {
        sendTikTokServerEvent(payload).catch(() => {});
    }, 0);
};
