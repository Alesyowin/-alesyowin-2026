/**
 * Script care modifică snapshot.json pentru a adăuga suport de traduceri relaționale
 * Adaugă: colecția languages, colecția giveaways_translations, câmpuri, relații
 * Marchează câmpurile vechi (title, subtitle, description, competition_details) ca hidden
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const snapshotPath = join(__dirname, '..', 'snapshot.json');

// Citim snapshot-ul existent
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'));

// ============================================
// 1. COLECȚII NOI
// ============================================

// Colecția languages — tabelă de referință pentru limbile suportate
const languagesCollection = {
  collection: "languages",
  meta: {
    accountability: "all",
    archive_app_filter: true,
    archive_field: null,
    archive_value: null,
    collapse: "open",
    collection: "languages",
    color: null,
    display_template: "{{name}} ({{code}})",
    group: null,
    hidden: true,
    icon: "translate",
    item_duplication_fields: null,
    note: "Limbile suportate de website",
    preview_url: null,
    singleton: false,
    sort: null,
    sort_field: null,
    translations: null,
    unarchive_value: null,
    versioning: false
  },
  schema: {
    name: "languages"
  }
};

// Colecția giveaways_translations — tabelă junction pentru traduceri
const giveawaysTranslationsCollection = {
  collection: "giveaways_translations",
  meta: {
    accountability: "all",
    archive_app_filter: true,
    archive_field: null,
    archive_value: null,
    collapse: "open",
    collection: "giveaways_translations",
    color: null,
    display_template: null,
    group: null,
    hidden: true,
    icon: "import_contacts",
    item_duplication_fields: null,
    note: "Traduceri conținut competiții",
    preview_url: null,
    singleton: false,
    sort: null,
    sort_field: null,
    translations: null,
    unarchive_value: null,
    versioning: false
  },
  schema: {
    name: "giveaways_translations"
  }
};

snapshot.data.collections.push(languagesCollection);
snapshot.data.collections.push(giveawaysTranslationsCollection);

// ============================================
// 2. CÂMPURI NOI
// ============================================

// --- Câmpuri pentru colecția languages ---
const languagesFields = [
  {
    collection: "languages",
    field: "code",
    type: "string",
    meta: {
      collection: "languages",
      conditions: null,
      display: null,
      display_options: null,
      field: "code",
      group: null,
      hidden: false,
      interface: "input",
      note: "Codul ISO al limbii (ex: en, ro, de)",
      options: null,
      readonly: false,
      required: true,
      searchable: true,
      sort: 1,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "half"
    },
    schema: {
      name: "code",
      table: "languages",
      data_type: "character varying",
      default_value: null,
      max_length: 10,
      numeric_precision: null,
      numeric_scale: null,
      is_nullable: false,
      is_unique: true,
      is_indexed: false,
      is_primary_key: true,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: false,
      foreign_key_table: null,
      foreign_key_column: null
    }
  },
  {
    collection: "languages",
    field: "name",
    type: "string",
    meta: {
      collection: "languages",
      conditions: null,
      display: null,
      display_options: null,
      field: "name",
      group: null,
      hidden: false,
      interface: "input",
      note: "Numele complet al limbii (ex: English, Română)",
      options: null,
      readonly: false,
      required: true,
      searchable: true,
      sort: 2,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "half"
    },
    schema: {
      name: "name",
      table: "languages",
      data_type: "character varying",
      default_value: null,
      max_length: 255,
      numeric_precision: null,
      numeric_scale: null,
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: false,
      foreign_key_table: null,
      foreign_key_column: null
    }
  }
];

// --- Câmpuri pentru colecția giveaways_translations ---
const translationsFields = [
  {
    collection: "giveaways_translations",
    field: "id",
    type: "integer",
    meta: {
      collection: "giveaways_translations",
      conditions: null,
      display: null,
      display_options: null,
      field: "id",
      group: null,
      hidden: true,
      interface: "input",
      note: null,
      options: null,
      readonly: true,
      required: false,
      searchable: true,
      sort: 1,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "full"
    },
    schema: {
      name: "id",
      table: "giveaways_translations",
      data_type: "integer",
      default_value: "nextval('giveaways_translations_id_seq'::regclass)",
      max_length: null,
      numeric_precision: 32,
      numeric_scale: 0,
      is_nullable: false,
      is_unique: true,
      is_indexed: false,
      is_primary_key: true,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: true,
      foreign_key_table: null,
      foreign_key_column: null
    }
  },
  {
    collection: "giveaways_translations",
    field: "giveaways_id",
    type: "integer",
    meta: {
      collection: "giveaways_translations",
      conditions: null,
      display: null,
      display_options: null,
      field: "giveaways_id",
      group: null,
      hidden: true,
      interface: null,
      note: null,
      options: null,
      readonly: false,
      required: false,
      searchable: true,
      sort: 2,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "full"
    },
    schema: {
      name: "giveaways_id",
      table: "giveaways_translations",
      data_type: "integer",
      default_value: null,
      max_length: null,
      numeric_precision: 32,
      numeric_scale: 0,
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: false,
      foreign_key_table: "giveaways",
      foreign_key_column: "id"
    }
  },
  {
    collection: "giveaways_translations",
    field: "languages_code",
    type: "string",
    meta: {
      collection: "giveaways_translations",
      conditions: null,
      display: null,
      display_options: null,
      field: "languages_code",
      group: null,
      hidden: true,
      interface: null,
      note: null,
      options: null,
      readonly: false,
      required: false,
      searchable: true,
      sort: 3,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "full"
    },
    schema: {
      name: "languages_code",
      table: "giveaways_translations",
      data_type: "character varying",
      default_value: null,
      max_length: 10,
      numeric_precision: null,
      numeric_scale: null,
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: false,
      foreign_key_table: "languages",
      foreign_key_column: "code"
    }
  },
  {
    collection: "giveaways_translations",
    field: "title",
    type: "text",
    meta: {
      collection: "giveaways_translations",
      conditions: null,
      display: null,
      display_options: null,
      field: "title",
      group: null,
      hidden: false,
      interface: "input",
      note: "Titlul competiției în limba selectată",
      options: null,
      readonly: false,
      required: false,
      searchable: true,
      sort: 4,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "full"
    },
    schema: {
      name: "title",
      table: "giveaways_translations",
      data_type: "text",
      default_value: null,
      max_length: null,
      numeric_precision: null,
      numeric_scale: null,
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: false,
      foreign_key_table: null,
      foreign_key_column: null
    }
  },
  {
    collection: "giveaways_translations",
    field: "subtitle",
    type: "text",
    meta: {
      collection: "giveaways_translations",
      conditions: null,
      display: null,
      display_options: null,
      field: "subtitle",
      group: null,
      hidden: false,
      interface: "input",
      note: "Subtitlul competiției în limba selectată",
      options: null,
      readonly: false,
      required: false,
      searchable: true,
      sort: 5,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "full"
    },
    schema: {
      name: "subtitle",
      table: "giveaways_translations",
      data_type: "text",
      default_value: null,
      max_length: null,
      numeric_precision: null,
      numeric_scale: null,
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: false,
      foreign_key_table: null,
      foreign_key_column: null
    }
  },
  {
    collection: "giveaways_translations",
    field: "description",
    type: "text",
    meta: {
      collection: "giveaways_translations",
      conditions: null,
      display: null,
      display_options: null,
      field: "description",
      group: null,
      hidden: false,
      interface: "input-rich-text-html",
      note: "Descrierea competiției în limba selectată (HTML)",
      options: null,
      readonly: false,
      required: false,
      searchable: true,
      sort: 6,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "full"
    },
    schema: {
      name: "description",
      table: "giveaways_translations",
      data_type: "text",
      default_value: null,
      max_length: null,
      numeric_precision: null,
      numeric_scale: null,
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: false,
      foreign_key_table: null,
      foreign_key_column: null
    }
  },
  {
    collection: "giveaways_translations",
    field: "competition_details",
    type: "text",
    meta: {
      collection: "giveaways_translations",
      conditions: null,
      display: null,
      display_options: null,
      field: "competition_details",
      group: null,
      hidden: false,
      interface: "input-rich-text-html",
      note: "Detalii concurs în limba selectată (HTML)",
      options: null,
      readonly: false,
      required: false,
      searchable: true,
      sort: 7,
      special: null,
      translations: null,
      validation: null,
      validation_message: null,
      width: "full"
    },
    schema: {
      name: "competition_details",
      table: "giveaways_translations",
      data_type: "text",
      default_value: null,
      max_length: null,
      numeric_precision: null,
      numeric_scale: null,
      is_nullable: true,
      is_unique: false,
      is_indexed: false,
      is_primary_key: false,
      is_generated: false,
      generation_expression: null,
      has_auto_increment: false,
      foreign_key_table: null,
      foreign_key_column: null
    }
  }
];

// --- Câmpul alias `translations` pe colecția giveaways ---
const translationsAliasField = {
  collection: "giveaways",
  field: "translations",
  type: "alias",
  meta: {
    collection: "giveaways",
    conditions: null,
    display: "translations",
    display_options: {
      template: "{{title}}",
      languageField: "name"
    },
    field: "translations",
    group: null,
    hidden: false,
    interface: "translations",
    note: "Traduceri conținut competiție (6 limbi)",
    options: {
      languageField: "name",
      defaultLanguage: "en"
    },
    readonly: false,
    required: false,
    searchable: true,
    sort: 34,
    special: [
      "translations"
    ],
    translations: null,
    validation: null,
    validation_message: null,
    width: "full"
  }
};

// Adăugăm toate câmpurile noi
snapshot.data.fields.push(...languagesFields);
snapshot.data.fields.push(...translationsFields);
snapshot.data.fields.push(translationsAliasField);

// ============================================
// 3. MARCHĂM CÂMPURILE VECHI CA HIDDEN
// ============================================

const fieldsToHide = ['title', 'subtitle', 'description', 'competition_details'];

for (const field of snapshot.data.fields) {
  if (
    field.collection === 'giveaways' &&
    fieldsToHide.includes(field.field) &&
    field.meta
  ) {
    field.meta.hidden = true;
    // Adăugăm notă că sunt câmpuri legacy
    field.meta.note = `[LEGACY] Câmp migrat în giveaways_translations. Nu mai modifica aici.`;
  }
}

// ============================================
// 4. RELAȚII NOI
// ============================================

const newRelations = [
  // Relația giveaways_translations.giveaways_id → giveaways.id
  {
    collection: "giveaways_translations",
    field: "giveaways_id",
    related_collection: "giveaways",
    meta: {
      junction_field: "languages_code",
      many_collection: "giveaways_translations",
      many_field: "giveaways_id",
      one_allowed_collections: null,
      one_collection: "giveaways",
      one_collection_field: null,
      one_deselect_action: "nullify",
      one_field: "translations",
      sort_field: null
    },
    schema: {
      table: "giveaways_translations",
      column: "giveaways_id",
      foreign_key_table: "giveaways",
      foreign_key_column: "id",
      constraint_name: "giveaways_translations_giveaways_id_foreign",
      on_update: "NO ACTION",
      on_delete: "SET NULL"
    }
  },
  // Relația giveaways_translations.languages_code → languages.code
  {
    collection: "giveaways_translations",
    field: "languages_code",
    related_collection: "languages",
    meta: {
      junction_field: "giveaways_id",
      many_collection: "giveaways_translations",
      many_field: "languages_code",
      one_allowed_collections: null,
      one_collection: "languages",
      one_collection_field: null,
      one_deselect_action: "nullify",
      one_field: null,
      sort_field: null
    },
    schema: {
      table: "giveaways_translations",
      column: "languages_code",
      foreign_key_table: "languages",
      foreign_key_column: "code",
      constraint_name: "giveaways_translations_languages_code_foreign",
      on_update: "NO ACTION",
      on_delete: "SET NULL"
    }
  }
];

snapshot.data.relations.push(...newRelations);

// ============================================
// 5. SALVARE SNAPSHOT MODIFICAT
// ============================================

writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');

console.log('✅ Snapshot actualizat cu succes!');
console.log('   - Colecții adăugate: languages, giveaways_translations');
console.log('   - Câmpuri adăugate: languages(2) + giveaways_translations(7) + giveaways.translations(1)');
console.log('   - Câmpuri vechi marcate hidden: title, subtitle, description, competition_details');
console.log('   - Relații adăugate: 2 (giveaways_translations → giveaways, giveaways_translations → languages)');
