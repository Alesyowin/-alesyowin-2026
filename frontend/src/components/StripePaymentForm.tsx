"use client";

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { useCartStore } from '../lib/store';

export default function StripePaymentForm({ amount, returnUrl }: { amount: number, returnUrl: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const { clearCart } = useCartStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setMessage('');

        // Confirmarea plății către serverele Stripe
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: returnUrl,
            },
        });

        // Dacă codul ajunge aici, înseamnă că a fost o eroare (card refuzat, fonduri insuficiente, etc.)
        // Altfel, utilizatorul va fi automat redirecționat de Stripe către return_url.
        if (error) {
            setMessage(error.message || 'An error occurred during payment.');
            setIsProcessing(false);
        } else {
            // Nu ar trebui să se ajungă pe acest ramură de obicei.
            clearCart();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            {/* Formularul efectiv randat sigur din iframe-urile Stripe */}
            <div className="bg-[#111] border border-[#00A5FF]/30 p-4 rounded-sm shadow-inner">
                <PaymentElement options={{ layout: "tabs" }} />
            </div>

            {message && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-sm px-4 py-3 text-red-400 text-sm">
                    ⚠️ {message}
                </div>
            )}
            
            <button
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className={`w-full py-4 rounded-sm font-black uppercase tracking-[0.3em] transition-all 
                ${isProcessing || !stripe || !elements 
                    ? 'bg-[#222] text-white/30 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#008ecc] via-[#00A5FF] to-[#3498db] text-black shadow-[0_0_20px_rgba(0,165,255,0.3)] hover:scale-[1.02]'}`}
            >
                {isProcessing ? 'Se procesează...' : `Confirmă și Plătește £${amount.toFixed(2)}`}
            </button>
        </form>
    );
}
