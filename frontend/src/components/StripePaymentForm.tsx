"use client";

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

interface StripePaymentFormProps {
    amount: number;
    buttonText: string;
    processingText: string;
    onBeforeConfirm: () => Promise<{ clientSecret: string; returnUrl: string } | null>;
}

// Componentă care afișează câmpurile de card Stripe direct pe pagină (fără formular separat)
export default function StripePaymentForm({ amount, buttonText, processingText, onBeforeConfirm }: StripePaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const handlePayment = async () => {
        if (!stripe || !elements || isProcessing) return;

        setIsProcessing(true);
        setMessage('');

        // Validăm câmpurile de card introduse de client
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setMessage(submitError.message || 'Card validation failed.');
            setIsProcessing(false);
            return;
        }

        // Creăm comanda + PaymentIntent prin funcția din pagina de checkout
        const result = await onBeforeConfirm();
        if (!result) {
            // Eroarea a fost deja afișată de pagina de checkout
            setIsProcessing(false);
            return;
        }

        // Confirmăm plata cu datele cardului introduse de utilizator
        const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: result.clientSecret,
            confirmParams: {
                return_url: result.returnUrl,
            },
        });

        // Dacă codul ajunge aici, înseamnă că plata a fost refuzată sau a apărut o eroare
        if (error) {
            setMessage(error.message || 'Payment failed.');
        }
        setIsProcessing(false);
    };

    return (
        <div className="space-y-6">
            {/* Formularul securizat Stripe pentru datele cardului */}
            <div className="bg-[#111] border border-[#00A5FF]/30 p-4 rounded-sm shadow-inner">
                <PaymentElement 
                    options={{ 
                        layout: "tabs",
                        fields: {
                            billingDetails: {
                                name: 'never',
                                email: 'never',
                                phone: 'never',
                                address: 'never'
                            }
                        }
                    }} 
                />
            </div>

            {message && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-sm px-4 py-3 text-red-400 text-sm">
                    ⚠️ {message}
                </div>
            )}
            
            <button
                type="button"
                onClick={handlePayment}
                disabled={isProcessing || !stripe || !elements}
                className={`w-full py-4 rounded-sm font-black uppercase tracking-[0.3em] text-sm transition-all duration-300
                ${isProcessing || !stripe || !elements 
                    ? 'bg-[#222] text-white/30 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#008ecc] via-[#00A5FF] to-[#3498db] text-black shadow-[0_0_20px_rgba(0,165,255,0.3)] hover:scale-[1.02]'}`}
            >
                {isProcessing ? (
                    <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {processingText}
                    </span>
                ) : `${buttonText} £${amount.toFixed(2)}`}
            </button>
        </div>
    );
}
