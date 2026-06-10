/**
 * Script de migrare: copiază datele existente din giveaways în giveaways_translations
 * 
 * Rulează o singură dată DUPĂ ce schema nouă a fost aplicată pe server.
 * 
 * Pași:
 * 1. Creează intrările din tabela languages (en, ro, de, fr, it, es)
 * 2. Pentru fiecare giveaway, copiază title/subtitle/description/competition_details
 *    în giveaways_translations cu languages_code = "en"
 * 3. Creează câte un rând gol pentru celelalte limbi
 *
 * Cum se folosește:
 *   DIRECTUS_URL=https://gpcompetition.onrender.com DIRECTUS_ADMIN_TOKEN=tokenul_tău node migrate-translations.mjs
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
    console.error('❌ Lipsește DIRECTUS_ADMIN_TOKEN! Setează-l înainte de a rula scriptul.');
    console.error('   Exemplu: DIRECTUS_ADMIN_TOKEN=tokenul_tău node migrate-translations.mjs');
    process.exit(1);
}

// Header-uri comune pentru toate requesturile
const headers = {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
};

// Limbile suportate
const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Română' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Español' }
];

async function apiRequest(method, path, body = null) {
    const url = `${DIRECTUS_URL}${path}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(`API ${method} ${path} — ${response.status}: ${JSON.stringify(data)}`);
    }
    
    return data.data;
}

async function main() {
    console.log('🚀 Început migrare traduceri...');
    console.log(`   Server: ${DIRECTUS_URL}`);
    console.log('');

    // ============================================
    // PASUL 1: Creare intrări languages
    // ============================================
    console.log('📝 Pasul 1: Creare intrări limbi...');
    
    for (const lang of LANGUAGES) {
        try {
            // Verificăm dacă limba există deja
            const existing = await apiRequest('GET', `/items/languages/${lang.code}`).catch(() => null);
            if (existing) {
                console.log(`   ✓ ${lang.code} (${lang.name}) — există deja`);
                continue;
            }
        } catch {
            // Nu există, o creăm
        }
        
        try {
            await apiRequest('POST', '/items/languages', lang);
            console.log(`   ✅ ${lang.code} (${lang.name}) — creat`);
        } catch (err) {
            // Ignorăm erorile de duplicat
            if (err.message.includes('unique') || err.message.includes('duplicate')) {
                console.log(`   ✓ ${lang.code} (${lang.name}) — există deja`);
            } else {
                console.warn(`   ⚠️ ${lang.code}: ${err.message}`);
            }
        }
    }
    console.log('');

    // ============================================
    // PASUL 2: Preluare toate giveaway-urile
    // ============================================
    console.log('📝 Pasul 2: Preluare giveaway-uri existente...');
    
    const giveaways = await apiRequest('GET', '/items/giveaways?fields=id,title,subtitle,description,competition_details&limit=-1');
    console.log(`   Găsite: ${giveaways.length} giveaway-uri`);
    console.log('');

    // ============================================
    // PASUL 3: Creare traduceri pentru fiecare giveaway
    // ============================================
    console.log('📝 Pasul 3: Creare traduceri...');
    
    for (const gw of giveaways) {
        console.log(`\n   🎯 Giveaway #${gw.id}: "${gw.title || '(fără titlu)'}"`);
        
        // Verificăm dacă are deja traduceri
        const existingTranslations = await apiRequest(
            'GET', 
            `/items/giveaways_translations?filter[giveaways_id][_eq]=${gw.id}&limit=-1`
        ).catch(() => []);
        
        const existingCodes = (existingTranslations || []).map(t => t.languages_code);
        
        for (const lang of LANGUAGES) {
            if (existingCodes.includes(lang.code)) {
                console.log(`      ✓ ${lang.code} — există deja`);
                continue;
            }
            
            // Pentru EN: copiază datele existente
            // Pentru celelalte limbi: rânduri goale (admin-ul le va completa)
            const translationData = {
                giveaways_id: gw.id,
                languages_code: lang.code,
                title: lang.code === 'en' ? (gw.title || '') : '',
                subtitle: lang.code === 'en' ? (gw.subtitle || '') : '',
                description: lang.code === 'en' ? (gw.description || '') : '',
                competition_details: lang.code === 'en' ? (gw.competition_details || '') : ''
            };
            
            try {
                await apiRequest('POST', '/items/giveaways_translations', translationData);
                console.log(`      ✅ ${lang.code} — creat${lang.code === 'en' ? ' (cu date existente)' : ' (gol, de completat)'}`);
            } catch (err) {
                console.error(`      ❌ ${lang.code}: ${err.message}`);
            }
        }
    }

    console.log('\n\n🎉 Migrare completă!');
    console.log('   Acum poți intra în Directus și vei vedea tab-urile cu limbi pe fiecare competiție.');
    console.log('   Textele EN sunt deja populate din datele existente.');
    console.log('   Completează manual traducerile RO, DE, FR, IT, ES.');
}

main().catch(err => {
    console.error('\n❌ Eroare fatală:', err.message);
    process.exit(1);
});
