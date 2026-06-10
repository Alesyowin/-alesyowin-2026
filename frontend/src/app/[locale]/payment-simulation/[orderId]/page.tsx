"use client";

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '../../../../i18n/routing';
import { Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PaymentSimulationPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const router = useRouter();
    const t = useTranslations('Payment');

    const [isSimulating, setIsSimulating] = useState(false);
    const [error, setError] = useState('');

    const handleSimulatePayment = async () => {
        setIsSimulating(true);
        setError('');

        try {
            console.log(`Sending webhook simulation for Order ID: ${orderId}...`);
            // Trigger the server-side webhook receiver
            const response = await fetch('/api/webhook/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Webhook failed to process');
            }

            // Webhook-ul a procesat cu succes — redirecționăm la pagina de succes cu orderId
            // pentru a putea verifica dacă utilizatorul a câștigat un premiu instant
            router.push(`/success?orderId=${orderId}`);

        } catch (err: any) {
            console.error('Simulation error:', err);
            setError(err.message || 'Error simulating payment.');
            setIsSimulating(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-8 md:p-12 rounded-sm shadow-[0_0_40px_rgba(212,175,55,0.1)] flex flex-col items-center max-w-xl w-full text-center">

                <div className="flex gap-4 mb-8">
                    <div className="w-16 h-16 bg-[#111] rounded-full border border-white/10 flex items-center justify-center">
                        <CreditCard size={32} className="text-white/60" />
                    </div>
                    <div className="w-16 h-16 bg-[#111] rounded-full border border-[#D4AF37]/50 flex items-center justify-center">
                        <ShieldCheck size={32} className="text-[#D4AF37]" />
                    </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {t('title')}
                </h1>

                <p className="text-white/50 mb-8 font-mono text-xs tracking-wider bg-[#111] py-2 px-4 border border-white/5 rounded-sm">
                    {t('orderRef')}: {orderId}
                </p>

                <p className="text-white/70 mb-10 leading-relaxed max-w-sm">
                    {t('description')}
                </p>

                {error && (
                    <div className="w-full bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-sm mb-8 text-sm text-left">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSimulatePayment}
                    disabled={isSimulating}
                    className={`
                        w-full py-4 px-8 uppercase tracking-[0.2em] font-black text-lg rounded-sm
                        transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-3 btn-gold-safe
                        ${isSimulating
                            ? 'bg-[#222] text-white/30 cursor-not-allowed border border-white/10'
                            : 'bg-gradient-to-r from-[#8b6914] via-[#D4AF37] to-[#f0d060] btn-gold-safe text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] btn-gold-safe'
                        }
                    `}
                    style={{ 
                        backgroundColor: '#D4AF37', 
                        opacity: 1, 
                        visibility: 'visible', 
                        zIndex: 999, 
                        position: 'relative', 
                        display: 'inline-block' 
                    }}
                >
                        {isSimulating ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                {t('processingWebhook')}
                            </>
                        ) : (
                            t('simulateBtn')
                        )}
                </button>

                <p className="text-white/30 text-xs mt-6">
                    {t('webhookNote')}
                </p>
            </div>
        </div>
    );
}
