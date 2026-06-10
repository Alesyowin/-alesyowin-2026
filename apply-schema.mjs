/**
 * Script care aplică snapshot-ul pe serverul Directus prin API REST
 * Echivalentul lui `npx directus schema apply ./snapshot.json`, dar prin HTTP
 * 
 * Pași: 
 *   1. Trimite snapshot-ul la POST /schema/diff pentru a obține diferențele
 *   2. Aplică diferențele prin POST /schema/apply
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configurare — folosim valorile din .env.local
const DIRECTUS_URL = 'https://alesyowin-backend.onrender.com';
const ADMIN_TOKEN = 'wGFrQpJRa7rpj1Y2YarOPp2tM0f8CMBj';

// Citim snapshot-ul
const snapshotPath = join(__dirname, 'snapshot.json');
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'));

const headers = {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
};

async function main() {
    console.log('🚀 Aplicare schema pe Directus (prin API)...');
    console.log(`   Server: ${DIRECTUS_URL}`);
    console.log('');

    // PASUL 1: Obținem diferențele (diff) între schema curentă și snapshot-ul nou
    console.log('📝 Pasul 1: Calculăm diferențele de schema...');
    
    const diffResponse = await fetch(`${DIRECTUS_URL}/schema/diff`, {
        method: 'POST',
        headers,
        body: JSON.stringify(snapshot.data || snapshot)
    });

    if (diffResponse.status === 204) {
        console.log('✅ Schema este deja la zi! Nu sunt diferențe de aplicat.');
        return;
    }

    if (!diffResponse.ok) {
        const errorText = await diffResponse.text();
        console.error(`❌ Eroare la calcularea diff-ului: ${diffResponse.status}`);
        console.error(errorText);
        process.exit(1);
    }

    const diffResult = await diffResponse.json();
    const diff = diffResult.data;
    const hash = diffResult.data?.hash;
    
    // Afișăm ce modificări vor fi aplicate
    if (diff.collections) {
        console.log(`   Colecții de modificat: ${diff.collections.length}`);
    }
    if (diff.fields) {
        console.log(`   Câmpuri de modificat: ${diff.fields.length}`);
    }
    if (diff.relations) {
        console.log(`   Relații de modificat: ${diff.relations.length}`);
    }
    if (hash) {
        console.log(`   Hash: ${hash}`);
    }
    console.log('');

    // PASUL 2: Aplicăm diferențele
    console.log('📝 Pasul 2: Aplicăm modificările pe server...');
    
    // Trimitem obiectul complet primit de la diff (inclusiv hash)
    const applyResponse = await fetch(`${DIRECTUS_URL}/schema/apply`, {
        method: 'POST',
        headers,
        body: JSON.stringify(diffResult.data)
    });

    if (!applyResponse.ok) {
        const errorText = await applyResponse.text();
        console.error(`❌ Eroare la aplicarea schema: ${applyResponse.status}`);
        console.error(errorText);
        process.exit(1);
    }

    console.log('✅ Schema aplicată cu succes pe server!');
    console.log('');
    console.log('   Noile colecții sunt acum disponibile:');
    console.log('   - languages (limbile suportate)');
    console.log('   - giveaways_translations (traduceri competiții)');
    console.log('   - giveaways.translations (câmp relațional cu tab-uri)');
}

main().catch(err => {
    console.error('\n❌ Eroare fatală:', err.message);
    process.exit(1);
});
