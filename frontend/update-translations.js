const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');

const translations = {
    "en": {
        "promoCodeLabel": "Have a promo code?",
        "promoCodePlaceholder": "Enter code here",
        "applyPromo": "Apply",
        "promoSuccess": "Promo code successfully applied!",
        "promoError": "This code is invalid, expired, or has reached its usage limit.",
        "promoApplied": "Promo code applied:"
    },
    "ro": {
        "promoCodeLabel": "Ai un cod promoțional?",
        "promoCodePlaceholder": "Introduce codul",
        "applyPromo": "Aplică",
        "promoSuccess": "Codul a fost aplicat cu succes!",
        "promoError": "Acest cod este invalid, a expirat sau limita de utilizări a fost atinsă.",
        "promoApplied": "Cod promoțional aplicat:"
    },
    "de": {
        "promoCodeLabel": "Haben Sie einen Promo-Code?",
        "promoCodePlaceholder": "Code eingeben",
        "applyPromo": "Anwenden",
        "promoSuccess": "Promo-Code erfolgreich angewendet!",
        "promoError": "Dieser Code ist ungültig, abgelaufen oder das Limit wurde erreicht.",
        "promoApplied": "Promo-Code angewendet:"
    },
    "fr": {
        "promoCodeLabel": "Vous avez un code promo ?",
        "promoCodePlaceholder": "Entrez le code",
        "applyPromo": "Appliquer",
        "promoSuccess": "Code promo appliqué avec succès !",
        "promoError": "Ce code est invalide, expiré ou la limite d'utilisation a été atteinte.",
        "promoApplied": "Code promo appliqué :"
    },
    "it": {
        "promoCodeLabel": "Hai un codice promozionale?",
        "promoCodePlaceholder": "Inserisci il codice",
        "applyPromo": "Applica",
        "promoSuccess": "Codice promozionale applicato con successo!",
        "promoError": "Questo codice è non valido, scaduto o ha raggiunto il limite di utilizzo.",
        "promoApplied": "Codice promozionale applicato:"
    },
    "es": {
        "promoCodeLabel": "¿Tienes un código promocional?",
        "promoCodePlaceholder": "Introduce el código",
        "applyPromo": "Aplicar",
        "promoSuccess": "¡Código promocional aplicado con éxito!",
        "promoError": "Este código es inválido, ha expirado o ha alcanzado su límite de uso.",
        "promoApplied": "Código promocional aplicado:"
    }
};

const files = fs.readdirSync(messagesDir);

files.forEach(file => {
    if (!file.endsWith('.json')) return;
    
    const locale = path.basename(file, '.json');
    if (!translations[locale]) return;
    
    const filePath = path.join(messagesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (content.Checkout) {
        // Add new translations
        Object.assign(content.Checkout, translations[locale]);
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        console.log(`Updated ${file}`);
    }
});

console.log('Translations updated successfully.');
