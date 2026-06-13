import { createDirectus, rest, staticToken, createField } from '@directus/sdk';

const DIRECTUS_URL = 'https://alesyowin-backend.onrender.com';
const ADMIN_TOKEN = 'UmdMZ1DCvOC-S8PnYGycPVgVb8linx2y';

const client = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function addOldPriceField() {
    try {
        console.log('Adding old_price field to giveaways collection...');
        await client.request(createField('giveaways', {
            field: 'old_price',
            type: 'float',
            meta: {
                interface: 'input',
                note: 'Prețul vechi (tăiat). Trebuie să fie mai mare decât prețul actual pentru a fi afișat.',
                icon: 'strikethrough_s'
            },
            schema: {
                is_nullable: true,
            }
        }));
        console.log('Successfully added old_price field!');
    } catch (error) {
        // Ignorăm eroarea dacă field-ul există deja
        if (error?.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE' || error?.errors?.[0]?.message?.includes('already exists')) {
            console.log('Field old_price already exists, continuing...');
        } else {
            console.error('Error adding old_price:', JSON.stringify(error?.errors || error, null, 2));
        }
    }
}

addOldPriceField();
