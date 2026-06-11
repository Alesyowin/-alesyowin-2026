import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY lipsește din variabilele de mediu');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia', // Folosim versiunea curentă stabilă
  appInfo: {
    name: 'Alesyowin',
    version: '1.0.0',
  },
});
