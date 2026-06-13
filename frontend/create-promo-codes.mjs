import { createDirectus, rest, staticToken, createCollection, createField } from '@directus/sdk';

const DIRECTUS_URL = 'https://alesyowin-backend.onrender.com';
const ADMIN_TOKEN = 'UmdMZ1DCvOC-S8PnYGycPVgVb8linx2y';

const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function setupDatabase() {
  try {
    console.log('Creating promo_codes collection...');
    
    // Create Collection
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
          type: 'uuid',
          meta: { hidden: true, readonly: true, interface: 'input' },
          schema: { is_primary_key: true, has_auto_increment: false }
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
        {
            field: 'sort',
            type: 'integer',
            meta: { interface: 'input', hidden: true }
        },
        {
            field: 'user_created',
            type: 'uuid',
            meta: { interface: 'user-created', special: ['user-created'], hidden: true }
        },
        {
            field: 'date_created',
            type: 'timestamp',
            meta: { interface: 'datetime', special: ['date-created'], hidden: true }
        },
        {
            field: 'user_updated',
            type: 'uuid',
            meta: { interface: 'user-updated', special: ['user-updated'], hidden: true }
        },
        {
            field: 'date_updated',
            type: 'timestamp',
            meta: { interface: 'datetime', special: ['date-updated'], hidden: true }
        },
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

    console.log('Collection promo_codes created successfully.');

    // Add promo_code to orders
    console.log('Adding promo_code to orders collection...');
    try {
        await client.request(createField('orders', {
            field: 'promo_code',
            type: 'string', // Just saving the string code is easier to track
            meta: {
                interface: 'input',
                note: 'Codul promoțional folosit pentru această comandă (dacă a existat)',
                readonly: true
            },
            schema: {
                is_nullable: true
            }
        }));
        console.log('Field promo_code added to orders successfully.');
    } catch (fieldErr) {
        if (fieldErr.errors && fieldErr.errors[0] && fieldErr.errors[0].extensions && fieldErr.errors[0].extensions.code === 'RECORD_NOT_UNIQUE') {
            console.log('Field promo_code already exists on orders. Skipping.');
        } else {
            console.error('Warning creating field in orders:', fieldErr);
        }
    }

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', JSON.stringify(error?.errors || error, null, 2));
  }
}

setupDatabase();
