import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';

// --- TypeScript Types ---
export interface GiveawayImage {
    id: string;
    directus_files_id: string | { id: string; filename_disk: string };
}

// Interfață pentru o traducere individuală din giveaways_translations
export interface GiveawayTranslation {
    id?: number;
    giveaways_id?: number;
    languages_code: string;
    title: string;
    subtitle?: string;
    description?: string;
    competition_details?: string;
}

// Interfața completă aliniată la schema reală din snapshot.json
export interface Giveaway {
    id: string;
    slug: string;
    title: string;
    subtitle?: string;                  // Tagline/subtitlu
    description: string;
    competition_details?: string;       // HTML rich text cu detalii concurs
    price_per_ticket: number;
    old_price?: number;                 // Prețul vechi (tăiat)
    product_id?: string;
    total_tickets: number;
    tickets_sold: number;
    tickets_left?: number;              // Câmp calculat în DB
    sold_count?: number;                // Contor vânzări alternativ
    end_date?: string | null;                   // Mapat din câmpul 'deadline'
    quiz_question: string;
    quiz_answer_1: string;
    quiz_answer_2: string;
    quiz_answer_3: string;
    correct_answer_index: number;       // 0, 1, sau 2 — mapat din 'correct_answer' (a/b/c)
    images?: GiveawayImage[];
    status: 'active' | 'ended' | 'draft' | 'published';
    category?: 'cars' | 'apartments' | 'cash' | 'tech' | string;
    enable_leaderboard?: boolean;
    instant_prizes?: any[];             // JSON array cu premii instant
    limit_per_user?: number;            // Default 1 în DB
    min_tickets?: number;               // Numărul minim obligatoriu de bilete
    bonus_draw?: string;                // HTML rich text (nou)
    bonus_draws?: any[];                // JSON array ptr carduri si progres
    translations?: GiveawayTranslation[]; // Traduceri relaționale din Directus
}

// --- Date Mock (folosite când Directus nu este disponibil) ---
export const MOCK_GIVEAWAY: Giveaway = {
    id: '1',
    slug: 'lamborghini-huracan',
    title: 'Lamborghini Huracán EVO',
    subtitle: 'The Ultimate Supercar Experience',
    description:
        'Win a brand new Lamborghini Huracán EVO. This is your chance to own one of the most iconic supercars ever made. Answer the quiz correctly and secure your ticket!',
    competition_details: '<p>The winner will be announced live on our Instagram account.</p>',
    price_per_ticket: 49,
    total_tickets: 5000,
    tickets_sold: 3247,
    tickets_left: 1753,
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    quiz_question: 'What is the engine displacement of the Lamborghini Huracán EVO?',
    quiz_answer_1: '3.5L V6',
    quiz_answer_2: '5.2L V10',
    quiz_answer_3: '6.5L V12',
    correct_answer_index: 1,
    status: 'active',
    category: 'cars',
    instant_prizes: [],
    bonus_draws: [],
    limit_per_user: 1,
    images: [],
};

// --- Directus Client ---
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://ALESYOWIN.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

let directusClient: ReturnType<typeof createDirectus> | null = null;

function getClient() {
    if (!directusClient) {
        // Creăm o funcție fetch personalizată care interzice strict cache-ul (foarte util pentru Next.js 14+)
        const noCacheFetch = (url: RequestInfo | URL, init?: RequestInit) => {
            return fetch(url, { ...init, cache: 'no-store' });
        };

        if (ADMIN_TOKEN && ADMIN_TOKEN !== 'ADAUGA_TOKEN_AICI') {
            // @ts-ignore
            directusClient = createDirectus(DIRECTUS_URL, { globals: { fetch: noCacheFetch } }).with(staticToken(ADMIN_TOKEN)).with(rest());
        } else {
            // @ts-ignore
            directusClient = createDirectus(DIRECTUS_URL, { globals: { fetch: noCacheFetch } }).with(rest());
        }
    }
    return directusClient;
}

// Convertire litera răspuns corect (a/b/c) la index numeric (0/1/2)
function mapCorrectAnswer(correctAnswer: string | null | undefined): number {
    if (!correctAnswer) return 0;
    const map: Record<string, number> = { a: 0, b: 1, c: 2, A: 0, B: 1, C: 2 };
    if (correctAnswer in map) return map[correctAnswer];
    // Dacă e deja un număr string (ex: "1")
    const num = parseInt(correctAnswer, 10);
    return isNaN(num) ? 0 : num;
}

// --- Helper: extrage traducerea corectă din array-ul de traduceri ---
// Logică: încearcă limba cerută → fallback la EN → fallback la prima traducere disponibilă
function extractTranslation(
    translations: GiveawayTranslation[] | undefined | null,
    locale: string
): { title: string; subtitle: string; description: string; competition_details: string } {
    // Valori implicite dacă nu există traduceri deloc
    const defaults = { title: '', subtitle: '', description: '', competition_details: '' };
    
    if (!translations || translations.length === 0) return defaults;
    
    // Căutăm traducerea pentru limba cerută
    let match = translations.find(t => t.languages_code === locale);
    
    // Dacă nu găsim sau are titlul gol, facem fallback la EN
    if (!match || !match.title) {
        match = translations.find(t => t.languages_code === 'en');
    }
    
    // Dacă nici EN nu există, luăm prima traducere care are titlu
    if (!match || !match.title) {
        match = translations.find(t => !!t.title);
    }
    
    if (!match) return defaults;
    
    return {
        title: match.title || '',
        subtitle: match.subtitle || '',
        description: match.description || '',
        competition_details: match.competition_details || ''
    };
}

// --- Preluare date Giveaway după ID (cu suport multilingv) ---
export async function getGiveawayBySlug(slug: string, locale: string = 'en'): Promise<Giveaway | null> {
    try {
        const client = getClient();

        // Folosim ID numeric — câmpul 'slug' nu există în schema reală
        const numericId = parseInt(slug, 10);
        if (isNaN(numericId) && slug !== MOCK_GIVEAWAY.slug) {
            return null;
        }

        const items = await (client as any).request(
            readItems('giveaways', {
                filter: { id: { _eq: numericId } },
                limit: 1,
                fields: [
                    'id',
                    'title',
                    'subtitle',
                    'description',
                    'competition_details',
                    'price',
                    'old_price',
                    'product_id',
                    'total_tickets',
                    'sold_tickets',
                    'tickets_left',
                    'sold_count',
                    'deadline',
                    'status',
                    'category',
                    'enable_leaderboard',
                    'question',
                    'answer_a',
                    'answer_b',
                    'answer_c',
                    'correct_answer',
                    'instant_prizes',
                    'bonus_draws',
                    'limit_per_user',
                    'min_tickets',
                    'image',
                    'image_2',
                    'image_3',
                    'image_4',
                    'image_5',
                    'image_6',
                    'image_7',
                    'image_8',
                    'image_9',
                    'image_10',
                    // Câmpuri traduceri relaționale
                    'translations.id',
                    'translations.languages_code',
                    'translations.title',
                    'translations.subtitle',
                    'translations.description',
                    'translations.competition_details',
                ],
            })
        );

        if (!items || items.length === 0) {
            if (slug === MOCK_GIVEAWAY.slug) return MOCK_GIVEAWAY;
            return null;
        }

        const data = items[0];

        // Extragem traducerea corectă pe baza locale-ului
        const translated = extractTranslation(data.translations, locale);

        // Mapare câmpuri reale → interfața Giveaway
        // Prioritizăm textele din traduceri, cu fallback la câmpurile legacy
        const mappedData: Giveaway = {
            id: String(data.id),
            slug: String(data.id),
            title: translated.title || data.title || 'Giveaway #' + data.id,
            subtitle: translated.subtitle || data.subtitle || undefined,
            description: translated.description || data.description || '',
            competition_details: translated.competition_details || data.competition_details || undefined,
            price_per_ticket: data.price ?? 0, // Folosim ?? în loc de || ca să respectăm prețul 0 (concursuri gratuite)
            old_price: data.old_price ? Number(data.old_price) : undefined,
            product_id: data.product_id || undefined,
            total_tickets: data.total_tickets || 0,
            tickets_sold: data.sold_tickets || 0,
            tickets_left: data.tickets_left ?? undefined,
            sold_count: data.sold_count ?? undefined,
            end_date: data.deadline || null,
            quiz_question: data.question || 'What is the capital of France?',
            quiz_answer_1: data.answer_a || 'London',
            quiz_answer_2: data.answer_b || 'Paris',
            quiz_answer_3: data.answer_c || 'Berlin',
            // Corectare bug: mapat din litera 'a'/'b'/'c' la index 0/1/2
            correct_answer_index: mapCorrectAnswer(data.correct_answer),
            status: data.status || 'draft',
            category: data.category || undefined,
            enable_leaderboard: data.enable_leaderboard === true,
            instant_prizes: data.instant_prizes || [],
            limit_per_user: data.limit_per_user ?? 1,
            min_tickets: data.min_tickets ?? 1,
            // Mapare imagini — câmpuri directe UUID
            images: [
                data.image ? { id: data.image, directus_files_id: data.image } : null,
                data.image_2 ? { id: data.image_2, directus_files_id: data.image_2 } : null,
                data.image_3 ? { id: data.image_3, directus_files_id: data.image_3 } : null,
                data.image_4 ? { id: data.image_4, directus_files_id: data.image_4 } : null,
                data.image_5 ? { id: data.image_5, directus_files_id: data.image_5 } : null,
                data.image_6 ? { id: data.image_6, directus_files_id: data.image_6 } : null,
                data.image_7 ? { id: data.image_7, directus_files_id: data.image_7 } : null,
                data.image_8 ? { id: data.image_8, directus_files_id: data.image_8 } : null,
                data.image_9 ? { id: data.image_9, directus_files_id: data.image_9 } : null,
                data.image_10 ? { id: data.image_10, directus_files_id: data.image_10 } : null,
            ].filter(Boolean) as GiveawayImage[],
            bonus_draw: data.bonus_draw || undefined,
            bonus_draws: data.bonus_draws || [],
            translations: data.translations || [],
        };

        return mappedData;
    } catch (error) {
        console.warn('[Directus] getGiveawayBySlug failed, using mock:', (error as any)?.message || error);
        if (slug === MOCK_GIVEAWAY.slug) return MOCK_GIVEAWAY;
        return null;
    }
}

// --- URL fișier Directus ---
// Rutăm prin proxy-ul local /api/asset/ pentru a evita 403 Forbidden
export function getDirectusFileUrl(
    fileId: string, 
    options?: { width?: number; quality?: number; format?: string }
): string {
    let url = `/api/asset/${fileId}`;
    
    if (options) {
        const params = new URLSearchParams();
        if (options.width) params.set('width', options.width.toString());
        if (options.quality) params.set('quality', options.quality.toString());
        if (options.format) params.set('format', options.format);
        
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }
    
    return url;
}

// --- Preluare toate Giveaway-urile (cu suport multilingv) ---
export async function getAllGiveaways(locale: string = 'en'): Promise<Giveaway[]> {
    try {
        const client = getClient();
        const items = await (client as any).request(
            readItems('giveaways', {
                fields: [
                    'id', 'sort', 'title', 'subtitle', 'status', 'image',
                    'total_tickets', 'sold_tickets', 'deadline', 'category', 'price', 'old_price',
                    // Câmpuri traduceri relaționale
                    'translations.languages_code',
                    'translations.title',
                    'translations.subtitle',
                ],
                limit: 50,
                sort: ['-sort', '-id'],
            })
        );

        if (!items) return [];

        return items.map((data: any): Giveaway => {
            // Extragem traducerea corectă pe baza locale-ului
            const translated = extractTranslation(data.translations, locale);
            
            return {
                id: String(data.id),
                slug: String(data.id),
                title: translated.title || data.title || 'Giveaway #' + data.id,
                subtitle: translated.subtitle || data.subtitle || undefined,
                description: '',
                price_per_ticket: data.price ?? 0,
                old_price: data.old_price ? Number(data.old_price) : undefined,
                total_tickets: data.total_tickets || 0,
                tickets_sold: data.sold_tickets || 0,
                end_date: data.deadline || null,
                quiz_question: '',
                quiz_answer_1: '',
                quiz_answer_2: '',
                quiz_answer_3: '',
                correct_answer_index: 0,
                status: data.status || 'draft',
                category: data.category || undefined,
                instant_prizes: [],
                bonus_draws: [],
                limit_per_user: 1,
                min_tickets: data.min_tickets ?? 1,
                images: data.image ? [{ id: data.image, directus_files_id: data.image }] : [],
                translations: data.translations || [],
            };
        });
    } catch (error) {
        console.warn('[Directus] getAllGiveaways failed:', (error as any)?.message || error);
        return [MOCK_GIVEAWAY];
    }
}
