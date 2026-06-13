"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '../../lib/store';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../i18n/routing';

interface QuizGateProps {
    giveawayId: string;
    giveawayTitle: string;
    giveawayImage?: string;
    question: string;
    answers: [string, string, string];
    correctIndex: number;
    price: number;
    currencySymbol?: string;
    // Prop nou: detectat automat dacă prețul e 0
    isFree?: boolean;
    minTickets?: number;
}

type AnswerState = 'idle' | 'correct' | 'wrong';

export default function QuizGate({
    giveawayId,
    giveawayTitle,
    giveawayImage,
    question,
    answers,
    correctIndex,
    price,
    currencySymbol = '£',
    isFree = false,
    minTickets = 1,
}: QuizGateProps) {
    const t = useTranslations('Giveaway');
    const addItem = useCartStore((state) => state.addItem);
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [selected, setSelected] = useState<number | null>(null);
    const [answerState, setAnswerState] = useState<AnswerState>('idle');
    const [unlocked, setUnlocked] = useState(false);
    const [shake, setShake] = useState(false);

    // Determinăm dacă e concurs gratuit — verificăm atât prop-ul cât și prețul direct
    // Aceasta asigură că isFree este corect chiar dacă prop-ul nu e trimis
    const isActuallyFree = isFree || price === 0;

    // Dacă e concurs gratuit, cantitatea este fixată la minTickets sau 1
    const [quantity, setQuantity] = useState<number>(Math.max(1, minTickets));
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);
    const sliderTrackRef = React.useRef<HTMLDivElement>(null);

    // Starea verificării participării anterioare
    const [hasEntered, setHasEntered] = useState<boolean>(false);
    const [checkingEntry, setCheckingEntry] = useState<boolean>(false);

    // Verificăm dacă utilizatorul logat a mai participat la acest concurs
    useEffect(() => {
        if (!isActuallyFree || !user) return; // Verificăm doar pentru concursuri gratuite și utilizatori logați

        const checkPreviousEntry = async () => {
            setCheckingEntry(true);
            try {
                const response = await fetch(`/api/check-entry?giveawayId=${giveawayId}`);
                const data = await response.json();
                setHasEntered(data.hasEntered || false);
            } catch (error) {
                console.error('[QuizGate] Could not check entry status:', error);
            } finally {
                setCheckingEntry(false);
            }
        };

        checkPreviousEntry();
    }, [isActuallyFree, user, giveawayId]);

    // TIKTOK S2S: ViewContent (Fire and forget, izolat, pe montare componentă giveaway)
    useEffect(() => {
        fetch('/api/tiktok-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'ViewContent',
                url: window.location.href,
                properties: {
                    value: Number(price) || 0,
                    currency: 'GBP',
                    contents: [{ content_id: giveawayId, quantity: 1, price: Number(price) }]
                }
            })
        }).catch(() => null);
    }, [giveawayId, price]);

    const handlePointerMove = (clientX: number) => {
        if (!sliderTrackRef.current || isActuallyFree) return; // Blocăm sliderul pentru concursuri gratuite
        const rect = sliderTrackRef.current.getBoundingClientRect();
        let percentage = (clientX - rect.left) / Math.max(1, rect.width);
        percentage = Math.max(0, Math.min(1, percentage));
        const newValue = Math.round(1 + percentage * 999);
        setQuantity(newValue);
    };

    const handleAnswer = (index: number) => {
        if (unlocked) return;
        setSelected(index);

        if (index === correctIndex) {
            setAnswerState('correct');
            setUnlocked(true);
        } else {
            setAnswerState('wrong');
            setShake(true);
            setTimeout(() => setShake(false), 600);
        }
    };

    const getButtonStyle = (index: number) => {
        const base =
            'w-full py-3 px-4 rounded-sm border text-sm md:text-base font-semibold tracking-wide transition-all duration-300 text-left';

        if (selected === index) {
            if (answerState === 'correct') {
                return `${base} border-green-500 bg-green-500/10 text-green-400 ring-2 ring-green-500/40`;
            }
            if (answerState === 'wrong') {
                return `${base} border-red-500 bg-red-500/10 text-red-400 ring-2 ring-red-500/40`;
            }
        }

        if (unlocked && index !== correctIndex) {
            return `${base} border-black/10 bg-transparent text-black/30 cursor-not-allowed`;
        }

        return `${base} border-[#00A5FF]/30 bg-gray-50 text-black hover:border-[#00A5FF] hover:bg-[#00A5FF]/10 cursor-pointer`;
    };

    // --- Condiții de afișare speciale pentru concursuri gratuite ---

    // Caz 1: Se verifică statusul de autentificare — arătăm un loader
    if (isAuthLoading || checkingEntry) {
        return (
            <div className="space-y-4">
                <div className="rounded-sm border border-[#00A5FF] bg-gray-50 p-5 md:p-7">
                    <div className="flex items-center justify-center gap-3 text-black/40">
                        <div className="w-4 h-4 border-2 border-[#00A5FF]/40 border-t-[#00A5FF] rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Caz 2: Concurs gratuit + utilizator NU este logat
    if (isActuallyFree && !user) {
        return (
            <div className="space-y-4">
                <div className="rounded-sm border border-[#00A5FF] bg-gray-50 p-5 md:p-7 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-[#00A5FF]/10 border border-[#00A5FF]/40 flex items-center justify-center text-[#00A5FF] font-black text-sm">
                            🔒
                        </div>
                        <p className="text-black font-semibold text-base md:text-lg leading-snug">
                            {t('loginToEnter')}
                        </p>
                    </div>
                </div>
                {/* Buton activ care redirecționează spre login */}
                <button
                    onClick={() => router.push('/login')}
                    className="w-full py-4 px-8 uppercase tracking-[0.2em] font-black text-base md:text-lg rounded-sm transition-all duration-500 relative overflow-hidden text-white shadow-[0_0_30px_rgba(0,165,255,0.5)] bg-electric-flow cursor-pointer hover:scale-[1.02]"
                >
                    {t('freeEntry')}
                </button>
            </div>
        );
    }

    // Caz 3: Concurs gratuit + utilizatorul A MAI PARTICIPAT
    if (isActuallyFree && hasEntered) {
        return (
            <div className="space-y-4">
                <div className="rounded-sm border border-green-500/40 bg-green-500/5 p-5 md:p-7 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-green-500/10 border border-green-500/40 flex items-center justify-center text-green-400 font-black text-sm">
                            ✓
                        </div>
                        <div>
                            <p className="text-green-400 font-bold text-base md:text-lg leading-snug">
                                {t('alreadyEntered')}
                            </p>
                            <p className="text-white/40 text-sm mt-1">
                                🍀
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Afișare normală (quiz + buton) ---
    return (
        <div className="space-y-6">
            {/* Quiz Card */}
            <div
                className={`rounded-sm border border-[#00A5FF] bg-gray-50 p-5 md:p-7 space-y-5 ${shake ? 'animate-shake' : ''
                    }`}
            >
                {/* Question Header */}
                <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#00A5FF]/10 border border-[#00A5FF]/40 flex items-center justify-center text-[#00A5FF] font-black text-sm">
                        ?
                    </div>
                    <p className="text-black font-semibold text-base md:text-lg leading-snug">{question}</p>
                </div>

                {/* Answer Buttons */}
                <div className="space-y-3">
                    {answers.map((answer, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            disabled={unlocked && i !== correctIndex}
                            className={getButtonStyle(i)}
                        >
                            <span className="text-[#00A5FF]/60 mr-2 font-mono text-xs">
                                {String.fromCharCode(65 + i)}.
                            </span>
                            {answer}
                        </button>
                    ))}
                </div>

                {/* Feedback message */}
                {answerState === 'wrong' && selected !== null && (
                    <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                        <span>✗</span> {t('wrongAnswer')}
                    </p>
                )}
                {answerState === 'correct' && (
                    <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                        <span>✓</span> {t('correctAnswer')}
                    </p>
                )}
            </div>

            {/* Selector Cantitate Bilete — ASCUNS pentru concursuri gratuite */}
            {!isActuallyFree && (
                <div className="pt-2 pb-2 space-y-7">
                    <div className="flex items-center gap-4 w-full relative">
                        {/* Tooltip pe Slider */}
                        <div className="absolute -top-7 left-[60px] right-[60px] pointer-events-none">
                            <div
                                onPointerDown={(e) => {
                                    setIsDraggingSlider(true);
                                    handlePointerMove(e.clientX);
                                    e.currentTarget.setPointerCapture(e.pointerId);
                                }}
                                onPointerMove={(e) => {
                                    if (isDraggingSlider) {
                                        handlePointerMove(e.clientX);
                                    }
                                }}
                                onPointerUp={(e) => {
                                    setIsDraggingSlider(false);
                                    e.currentTarget.releasePointerCapture(e.pointerId);
                                }}
                                className={`absolute top-0 -translate-x-1/2 bg-[#00A5FF] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-md whitespace-nowrap pointer-events-auto touch-none select-none cursor-grab active:cursor-grabbing ${isDraggingSlider ? 'scale-110' : 'scale-100 hover:scale-105'} transition-transform`}
                                style={{ left: `calc(${((quantity - 1) / 999) * 100}%)` }}
                            >
                                {t('ticketsSelected', { count: quantity })}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[#00A5FF]"></div>
                            </div>
                        </div>

                        {/* Buton Minus */}
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(minTickets > 0 ? minTickets : 1, quantity - 1))}
                            className="w-11 h-11 shrink-0 rounded-sm bg-gray-100 border border-[#00A5FF]/30 text-[#00A5FF] hover:bg-[#00A5FF] hover:text-white flex items-center justify-center font-bold text-xl select-none transition-colors"
                        >
                            -
                        </button>

                        {/* Slider (Range) */}
                        <div ref={sliderTrackRef} className="w-full relative flex items-center h-11">
                            <input
                                type="range"
                                min={minTickets > 0 ? minTickets : 1}
                                max="1000"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer outline-none custom-slider"
                                style={{
                                    background: `linear-gradient(to right, #00A5FF ${((quantity - 1) / 999) * 100}%, rgba(0, 165, 255, 0.2) ${((quantity - 1) / 999) * 100}%)`
                                }}
                            />
                        </div>

                        {/* Buton Plus */}
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.min(1000, quantity + 1))}
                            className="w-11 h-11 shrink-0 rounded-sm bg-gray-100 border border-[#00A5FF]/30 text-[#00A5FF] hover:bg-[#00A5FF] hover:text-white flex items-center justify-center font-bold text-xl select-none transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>
            )}

            {/* Add to Cart Button */}
            <button
                disabled={!unlocked}
                onClick={() => {
                    if (!unlocked) return;
                    
                    const finalQuantity = isActuallyFree ? (minTickets > 0 ? minTickets : 1) : quantity;
                    
                    // Generare Event ID comun pentru dedublare Meta
                    const addToCartEventId = crypto.randomUUID();

                    // META CAPI: AddToCart
                    fetch('/api/meta-conversion', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventName: 'AddToCart',
                            eventId: addToCartEventId,
                            eventSourceUrl: window.location.href,
                            customData: {
                                value: price * finalQuantity,
                                currency: 'GBP',
                                contentIds: [giveawayId],
                                contents: [{ id: giveawayId, quantity: finalQuantity, item_price: Number(price) }]
                            }
                        })
                    }).catch(() => null); // Silent non-blocking fail

                    // META PIXEL (Frontend): AddToCart
                    if (typeof window !== 'undefined' && (window as any).fbq) {
                        (window as any).fbq('track', 'AddToCart', {
                            value: price * finalQuantity,
                            currency: 'GBP',
                            content_ids: [giveawayId],
                            contents: [{ id: giveawayId, quantity: finalQuantity, item_price: Number(price) }]
                        }, { eventID: addToCartEventId });
                    }

                    // TIKTOK S2S: AddToCart (Fire and forget from client)
                    fetch('/api/tiktok-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event: 'AddToCart',
                            url: window.location.href,
                            properties: {
                                value: price * finalQuantity,
                                currency: 'GBP',
                                contents: [{ content_id: giveawayId, quantity: finalQuantity, price: Number(price) }]
                            }
                        })
                    }).catch(() => null); // Silent non-blocking fail

                    addItem({
                        id: giveawayId,
                        title: giveawayTitle,
                        price: price,
                        quantity: finalQuantity,
                        image: giveawayImage,
                        minTickets: minTickets, // Transmitem și limita minimă la coș
                        quizAnswer: selected !== null ? selected : undefined
                    });
                }}
                className={`
          w-full py-4 px-8 uppercase tracking-[0.2em] font-black text-base md:text-lg rounded-sm
          transition-all duration-500 relative overflow-hidden
          ${unlocked
                        ? 'text-white shadow-[0_0_30px_rgba(0,165,255,0.5)] bg-electric-flow cursor-pointer hover:scale-[1.02]'
                        : 'bg-[#00A5FF] text-white border border-[#00A5FF] cursor-not-allowed'
                    }
        `}
            >
                {unlocked ? (
                    <span>
                        {isActuallyFree
                            ? t('freeEntry') // "Enter for Free" în loc de preț
                            : t('enterNowFor', { total: `${currencySymbol}${Number(price * quantity).toFixed(2)}` })
                        }
                    </span>
                ) : (
                    <>
                        {t('lockedBtn')}
                    </>
                )}
            </button>

            <style jsx global>{`
        @keyframes electric-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-blue {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 165, 255, 0.4); }
          50% { box-shadow: 0 0 50px rgba(0, 165, 255, 0.8), 0 0 80px rgba(102, 197, 255, 0.3); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .bg-electric-flow {
          background: linear-gradient(90deg, #00A5FF, #0055ff, #00fbff, #00A5FF);
          background-size: 200% auto;
          border: 1px solid #00A5FF;
          animation: electric-flow 3s linear infinite, pulse-blue 2s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .custom-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #00A5FF;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,165,255,0.8);
          border: 2px solid #fff;
        }
        .custom-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #00A5FF;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,165,255,0.8);
          border: 2px solid #fff;
        }
      `}</style>
        </div>
    );
}
