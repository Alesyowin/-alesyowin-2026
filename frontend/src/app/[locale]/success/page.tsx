"use client";

import { CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { Link } from '../../../i18n/routing';
import { useTranslations } from 'next-intl';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '../../../lib/store';

// Componenta internă care folosește useSearchParams (necesită Suspense)
function SuccessContent() {
    const t = useTranslations('Success');
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    // Starea pentru câștigul instant
    const [instantWin, setInstantWin] = useState<{
        won: boolean;
        prize_amount?: number;
        prize_currency?: string;
    } | null>(null);
    const [checking, setChecking] = useState(false);

    const { clearCart } = useCartStore();

    useEffect(() => {
        // Golește coșul după plată cu succes (pentru a nu-l goli prea devreme pe pagina de checkout)
        clearCart();
        
        // Dacă avem orderId, verificăm dacă utilizatorul a câștigat un premiu instant
        if (!orderId) return;

        // --- TRACKING PURCHASE: META (Dedublat cu Event ID comun salvat din checkout) ---
        const pendingDataStr = sessionStorage.getItem('pendingPurchaseData');
        if (pendingDataStr) {
            try {
                const purchaseData = JSON.parse(pendingDataStr);
                const purchaseTotal = purchaseData.total;
                // Folosim Event ID-ul generat la checkout (comun Pixel + CAPI) pentru deduplicare
                const purchaseEventId = purchaseData.eventId;

                // 1. META CAPI — cu Advanced Matching (date client criptate automat SHA-256 de SDK)
                fetch('/api/meta-conversion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventName: 'Purchase',
                        eventId: purchaseEventId,
                        eventSourceUrl: window.location.href,
                        // Date client pentru Advanced Matching
                        userData: purchaseData.userData,
                        customData: {
                            value: purchaseTotal,
                            currency: purchaseData.currency || 'GBP',
                            orderId: orderId,
                            contentIds: purchaseData.contentIds
                        }
                    })
                }).catch(() => null);

                // 2. META PIXEL (Frontend) — cu același Event ID pentru deduplicare
                if (typeof window !== 'undefined' && (window as any).fbq) {
                    (window as any).fbq('track', 'Purchase', {
                        value: purchaseTotal,
                        currency: purchaseData.currency || 'GBP'
                    }, { eventID: purchaseEventId });
                }
            } catch (parseError) {
                console.warn('Eroare la parsarea datelor Purchase din sessionStorage:', parseError);
            }

            // Ștergem datele imediat pentru a nu retrimite evenimentul la Refresh (F5)
            sessionStorage.removeItem('pendingPurchaseData');
        }
        // ------------------------------------------

        const checkInstantWin = async () => {
            setChecking(true);
            try {
                const res = await fetch(`/api/instant-win-check?orderId=${orderId}`);
                const data = await res.json();
                if (data.won) {
                    setInstantWin({
                        won: true,
                        prize_amount: data.prize_amount,
                        prize_currency: data.prize_currency,
                    });
                } else {
                    setInstantWin({ won: false });
                }
            } catch (err) {
                console.warn('Instant win check failed:', err);
                setInstantWin({ won: false });
            } finally {
                setChecking(false);
            }
        };

        const sessionId = searchParams.get('session_id');
        const paymentIntentId = searchParams.get('payment_intent');

        const verifyStripeSession = async () => {
            if ((sessionId || paymentIntentId) && orderId) {
                try {
                    await fetch('/api/stripe/verify-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId, paymentIntentId, orderId }),
                    });
                } catch (err) {
                    console.warn('Verify session failed:', err);
                }
            }
        };

        // Verificăm sesiunea Stripe apoi așteptăm puțin ca webhook-ul să termine procesarea
        verifyStripeSession().then(() => {
            setTimeout(checkInstantWin, 1500);
        });
    }, [orderId, searchParams]);

    return (
        <div className="min-h-screen bg-black w-full flex flex-col items-center justify-center p-4">

            {/* Banner Instant Win - afișat dacă a câștigat */}
            {instantWin?.won && (
                <div className="w-full max-w-2xl mb-8 relative overflow-hidden">
                    {/* Fundal auriu animat */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00A5FF] via-[#B8932C] to-[#00A5FF] animate-pulse opacity-90 rounded-xl" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 rounded-xl" />

                    {/* Efect de strălucire în colțuri */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />

                    <div className="relative z-10 p-8 text-center">
                        {/* Iconița trofeu mare */}
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center border-2 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                <Trophy size={40} className="text-white drop-shadow-lg" />
                            </div>
                        </div>

                        {/* Text felicitare */}
                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-widest mb-3 drop-shadow-lg"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            {t('instantWinCongrats')}
                        </h2>

                        {/* Suma premiului */}
                        <p className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-xl">
                            {instantWin.prize_amount?.toLocaleString()} {instantWin.prize_currency}
                        </p>

                        <p className="text-white/80 text-base font-medium">
                            {t('instantWinMsg')}
                        </p>
                    </div>
                </div>
            )}

            {/* Card principal de succes */}
            <div className="bg-black border border-[#00A5FF] p-12 rounded-sm shadow-[0_0_40px_rgba(0,165,255,0.1)] flex flex-col items-center max-w-lg w-full text-center">
                <div className="w-24 h-24 bg-[#111] rounded-full border border-[#00A5FF]/50 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-[#00A5FF]/10rounded-full animate-ping"></div>
                    <CheckCircle2 size={48} className="text-[#00A5FF] relative z-10" />
                </div>

                <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-4"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {t('title')}
                </h1>

                {/* Indicator verificare în curs */}
                {checking && (
                    <div className="flex items-center gap-2 mb-4 text-[#00A5FF]/60 text-sm">
                        <Sparkles size={16} className="animate-spin" />
                        <span>Se verifică premiile instant...</span>
                    </div>
                )}

                <p className="text-white/60 mb-8 leading-relaxed">
                    {t('message')}
                </p>

                <Link
                    href="/entry-list"
                    className="inline-block py-4 px-8 bg-gradient-to-r from-[#008ecc] via-[#00A5FF] to-[#3498db] btn-gold-safe text-black font-black uppercase tracking-[0.2em] rounded-sm hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(0,165,255,0.3)] w-full"
                >
                    {t('checkTickets')}
                </Link>
            </div>
        </div>
    );
}

// Componenta principală exportată cu Suspense wrapper (necesar pentru useSearchParams Next.js)
export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00A5FF] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
