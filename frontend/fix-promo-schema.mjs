import { createDirectus, rest, staticToken, createCollection, createField, deleteCollection, createRelation } from '@directus/sdk';

const DIRECTUS_URL = 'https://alesyowin-backend.onrender.com';
const ADMIN_TOKEN = 'UmdMZ1DCvOC-S8PnYGycPVgVb8linx2y';

const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function fixDatabase() {
  try {
    console.log('1. Deleting old promo_codes collection...');
    try {
        await client.request(deleteCollection('promo_codes'));
        console.log('Old collection deleted.');
    } catch (e) {
        console.log('Collection might not exist or failed to delete:', e.message);
    }
    
    // We also need to delete the M2M junction collection if it exists
    try {
        await client.request(deleteCollection('promo_codes_giveaways'));
    } catch(e) {}

    console.log('2. Recreating promo_codes collection with Integer ID...');
    
    await client.request(createCollection({
      collection: 'promo_codes',
      meta: {
        icon: 'local_offer',
        note: 'Coduri de reducere (Promo Codes)',
        display_template: '{{code}} ({{discount_percentage}}%)',
        hidden: false,
        singleton: false,
        translations: [
            { language: 'en-US', translation: 'Promo Codes', plural: 'Promo Codes' },
            { language: 'ro-RO', translation: 'Coduri Reducere', plural: 'Coduri Reducere' }
        ]
      },
      schema: {
        name: 'promo_codes'
      },
      fields: [
        {
          field: 'id',
          type: 'integer',
          meta: { hidden: true, readonly: true, interface: 'input' },
          schema: { is_primary_key: true, has_auto_increment: true } // FIX: Auto Increment!
        },
        {
            field: 'status',
            type: 'string',
            meta: {
                interface: 'select-dropdown',
                options: {
                    choices: [
                        { text: 'Published', value: 'published' },
                        { text: 'Draft', value: 'draft' },
                        { text: 'Archived', value: 'archived' }
                    ]
                },
                display: 'labels',
                display_options: {
                    showAsDot: true,
                    choices: [
                        { text: 'Published', value: 'published', foreground: '#FFFFFF', background: '#2F80ED' },
                        { text: 'Draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
                        { text: 'Archived', value: 'archived', foreground: '#FFFFFF', background: '#F2994A' }
                    ]
                }
            },
            schema: { default_value: 'published' }
        },
        { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
        { field: 'user_created', type: 'uuid', meta: { interface: 'user-created', special: ['user-created'], hidden: true } },
        { field: 'date_created', type: 'timestamp', meta: { interface: 'datetime', special: ['date-created'], hidden: true } },
        { field: 'user_updated', type: 'uuid', meta: { interface: 'user-updated', special: ['user-updated'], hidden: true } },
        { field: 'date_updated', type: 'timestamp', meta: { interface: 'datetime', special: ['date-updated'], hidden: true } },
        {
          field: 'code',
          type: 'string',
          meta: { interface: 'input', required: true, note: 'Ex: GRATIS100, REDUCERE50' },
          schema: { is_unique: true, is_nullable: false }
        },
        {
          field: 'discount_percentage',
          type: 'integer',
          meta: { interface: 'input', required: true, note: 'Introdu procentul, ex: 100 pentru gratuit' },
          schema: { is_nullable: false, default_value: 0 }
        },
        {
          field: 'max_uses',
          type: 'integer',
          meta: { interface: 'input', note: 'Lasă gol pentru utilizări nelimitate' },
          schema: { is_nullable: true }
        },
        {
          field: 'current_uses',
          type: 'integer',
          meta: { interface: 'input', readonly: true, note: 'De câte ori a fost folosit până acum' },
          schema: { is_nullable: false, default_value: 0 }
        },
        {
          field: 'valid_until',
          type: 'timestamp',
          meta: { interface: 'datetime', note: 'Data și ora la care expiră codul. Lasă gol dacă nu expiră niciodată.' },
          schema: { is_nullable: true }
        },
        {
          field: 'is_active',
          type: 'boolean',
          meta: { interface: 'boolean', note: 'Dezactivează pentru a suspenda temporar codul' },
          schema: { is_nullable: false, default_value: true }
        }
      ]
    }));
    console.log('Collection promo_codes created successfully with auto-increment ID.');

    console.log('3. Setting up Many-to-Many relation with giveaways...');
    // Create the junction collection
    await client.request(createCollection({
        collection: 'promo_codes_giveaways',
        meta: {
            hidden: true,
        },
        schema: {
            name: 'promo_codes_giveaways'
        },
        fields: [
            { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
            { field: 'promo_codes_id', type: 'integer' }, // Changed to integer since we changed promo_codes id to integer
            { field: 'giveaways_id', type: 'integer' }
        ]
    }));

    // Setup Relations
    await client.request(createRelation({
        collection: 'promo_codes_giveaways',
        field: 'promo_codes_id',
        related_collection: 'promo_codes',
        meta: {
            junction_field: 'giveaways_id'
        }
    }));

    await client.request(createRelation({
        collection: 'promo_codes_giveaways',
        field: 'giveaways_id',
        related_collection: 'giveaways',
        meta: {
            junction_field: 'promo_codes_id'
        }
    }));

    // Create the Alias field on promo_codes so it shows up in the App
    await client.request(createField('promo_codes', {
        field: 'applicable_giveaways',
        type: 'alias',
        meta: {
            interface: 'list-m2m',
            note: 'Alege concursurile la care se aplică acest cod. Dacă lași GOL, se va aplica la TOATE concursurile.',
            options: {
                enableCreate: false,
            },
            display: 'related-values',
            display_options: {
                template: '{{giveaways_id.title}}'
            }
        }
    }));

    // Make sure orders can use integer promo_code (we created it as string earlier)
    // Directus doesn't strictly enforce string vs int for simple fields unless it's a foreign key,
    // but our field was created as "string". That's fine, we can store '1' or '2'.

    console.log('Database fixed successfully!');
  } catch (error) {
    console.error('Error fixing database:', JSON.stringify(error?.errors || error, null, 2));
  }
}

fixDatabase();
