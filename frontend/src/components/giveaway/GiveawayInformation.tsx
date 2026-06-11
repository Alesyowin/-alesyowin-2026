"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, Crown } from 'lucide-react';
import { useGiveawayLive, InstantPrize, BonusDraw } from './GiveawayLiveProvider';

interface GiveawayInformationProps {
    description?: string;
    competitionDetails?: string;
    instantPrizes?: InstantPrize[] | any[];
    bonusDraw?: string;
    giveawayId?: string; // ID-ul giveaway-ului
    price?: number; // Prețul per bilet — folosit pentru tracking ViewContent (value + currency)
}

// Card premium tip bilet
function InstantPrizeCard({ prize, t }: { prize: InstantPrize; t: any }) {
    const isWon = prize.is_won;

    return (
        <div className={`
            relative overflow-hidden aspect-[1.1/1] sm:aspect-[1.6/1] rounded-lg shadow-2xl transition-all duration-700 group flex flex-col items-center justify-center text-center select-none
            ${isWon
                ? 'bg-gradient-to-br from-[#00A5FF] via-[#66C5FF] to-[#005A99] scale-[1.02] shadow-[0_0_30px_rgba(0,165,255,0.4)]'
                : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 border border-black/5 hover:border-[#00A5FF]/20'
            }
        `}>
            {/* Decupaje laterale tip bilet */}
            <div className="absolute top-1/2 -left-3 w-5 h-5 md:w-6 md:h-6 rounded-full -translate-y-1/2 z-10 bg-[#080808]" />
            <div className="absolute top-1/2 -right-3 w-5 h-5 md:w-6 md:h-6 rounded-full -translate-y-1/2 z-10 bg-[#080808]" />

            {/* Linie de perforare */}
            <div className={`absolute top-1/2 left-4 right-4 h-[1px] border-t border-dashed -translate-y-1/2 pointer-events-none opacity-20 ${isWon ? 'border-black' : 'border-[#00A5FF]'}`} />

            {/* Numele site-ului + numărul biletului */}
            <div className="relative z-20 space-y-0.5 md:space-y-1 mb-2 md:mb-5">
                <h4 className={`text-[10px] sm:text-base md:text-lg font-black uppercase tracking-[0.15em] md:tracking-[0.2em] italic ${isWon ? 'text-black' : 'text-[#00A5FF] drop-shadow-[0_0_8px_rgba(0,165,255,0.3)]'}`}>
                    ALESYOWIN
                </h4>
                <p className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] ${isWon ? 'text-black/60' : 'text-[#00A5FF]/50'}`}>
                    {prize.ticket_number != null ? `BILET ${prize.ticket_number}` : 'BILET ----'}
                </p>
            </div>

            {/* Suma premiului */}
            <div className="relative z-20 px-2 md:px-4">
                <div className={`text-sm sm:text-lg md:text-xl font-black mb-1 md:mb-2 ${isWon ? 'text-black' : 'text-black/90'}`}>
                    {prize.prize_amount != null
                        ? `${Number(prize.prize_amount).toLocaleString()} ${prize.prize_currency || ''}`
                        : '—'
                    }
                </div>

                {isWon ? (
                    <div className="flex flex-col items-center gap-0.5 md:gap-1">
                        <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-black/15 rounded-sm">
                            <Crown size={9} className="text-black md:w-[11px] md:h-[11px]" />
                            <span className="text-[7px] md:text-[9px] font-black uppercase tracking-wider text-black">CÂȘTIGAT</span>
                        </div>
                        {prize.winner_name && (
                            <p className="text-[9px] md:text-xs font-black uppercase tracking-widest text-black/70 max-w-[100px] md:max-w-[140px] truncate mt-0.5">
                                {prize.winner_name}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-1 md:gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            {t('instantWinAvailable')}
                        </span>
                    </div>
                )}
            </div>

            {/* Shimmer la hover pentru bilete disponibile */}
            {!isWon && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            )}
        </div>
    );
}

// Card premium tip bilet pentru Bonus Draw
function BonusDrawCard({ draw, t, isHighlighted }: { draw: BonusDraw; t: any; isHighlighted?: boolean }) {
    const isWon = draw.is_won;

    return (
        <div 
            id={`bonus-card-${draw.percentage}`}
            className={`
            relative overflow-hidden aspect-[1.1/1] sm:aspect-[1.6/1] rounded-lg shadow-2xl transition-all duration-700 group flex flex-col items-center justify-center text-center select-none
            ${isWon
                ? 'bg-gradient-to-br from-[#00A5FF] via-[#66C5FF] to-[#005A99] scale-[1.02] shadow-[0_0_30px_rgba(0,165,255,0.4)]'
                : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 hover:border-[#00A5FF]/20'
            }
            ${isHighlighted ? 'ring-2 ring-offset-2 ring-offset-white ring-[#66C5FF] scale-105 shadow-[0_0_40px_rgba(0,165,255,0.6)] z-10' : 'border border-black/5'}
        `}
        >
            {/* Decupaje laterale tip bilet */}
            <div className="absolute top-1/2 -left-3 w-5 h-5 md:w-6 md:h-6 rounded-full -translate-y-1/2 z-10 bg-[#080808]" />
            <div className="absolute top-1/2 -right-3 w-5 h-5 md:w-6 md:h-6 rounded-full -translate-y-1/2 z-10 bg-[#080808]" />

            {/* Linie de perforare */}
            <div className={`absolute top-1/2 left-4 right-4 h-[1px] border-t border-dashed -translate-y-1/2 pointer-events-none opacity-20 ${isWon ? 'border-black' : 'border-[#00A5FF]'}`} />

            {/* Numele site-ului ... */}
            <div className="relative z-20 space-y-0.5 md:space-y-1 mb-2 md:mb-5">
                <h4 className={`text-[10px] sm:text-base md:text-lg font-black uppercase tracking-[0.15em] md:tracking-[0.2em] italic ${isWon ? 'text-black' : 'text-[#00A5FF] drop-shadow-[0_0_8px_rgba(0,165,255,0.3)]'}`}>
                    ALESYOWIN
                </h4>
                <p className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center justify-center gap-1 ${isWon ? 'text-black/60' : 'text-[#00A5FF]/70'}`}>
                    <Trophy size={10} /> {draw.percentage || 0}% BONUS DRAW
                </p>
            </div>

            {/* Suma premiului */}
            <div className="relative z-20 px-2 md:px-4">
                <div className={`text-sm sm:text-lg md:text-xl font-black mb-1 md:mb-2 ${isWon ? 'text-black' : 'text-black/90'}`}>
                    {draw.prize_amount != null ? `${Number(draw.prize_amount).toLocaleString()} ${draw.prize_currency || ''}` : '—'}
                </div>

                {isWon ? (
                    <div className="flex flex-col items-center gap-0.5 md:gap-1">
                        <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-black/15 rounded-sm">
                            <Crown size={9} className="text-black md:w-[11px] md:h-[11px]" />
                            <span className="text-[7px] md:text-[9px] font-black uppercase tracking-wider text-black">WON</span>
                        </div>
                        {draw.winner_name && (
                            <div className="flex flex-col items-center mt-0.5">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/80 max-w-[100px] md:max-w-[140px] truncate">
                                    {draw.winner_name}
                                </p>
                                {draw.winner_ticket && (
                                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[#005A99] mt-0.5">
                                        BILET {draw.winner_ticket}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-1 md:gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-[#00A5FF] rounded-full animate-pulse" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#00A5FF]">
                            LOCKED
                        </span>
                    </div>
                )}
            </div>

            {/* Shimmer la hover */}
            {!isWon && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            )}
        </div>
    );
}

export default function GiveawayInformation({
    description,
    competitionDetails,
    bonusDraw,
    giveawayId,
    price,
}: GiveawayInformationProps) {
    const t = useTranslations('GiveawayPage');
    const [activeTab, setActiveTab] = useState<'prizes' | 'description' | 'details' | 'bonus'>('prizes');
    const [highlightedDraw, setHighlightedDraw] = useState<number | null>(null);

    const { prizes, bonusDraws } = useGiveawayLive();

    // --- META CONVERSIONS API & PIXEL: ViewContent ---
    useEffect(() => {
        if (giveawayId) {
            const eventId = crypto.randomUUID();
            
            // 1. Conversions API (Backend) — cu valoare dinamică
            fetch('/api/meta-conversion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventName: 'ViewContent',
                    eventSourceUrl: window.location.href,
                    eventId: eventId,
                    customData: {
                        contentIds: [giveawayId],
                        value: Number(price) || 0,
                        currency: 'GBP'
                    }
                })
            }).catch(err => console.error("Eroare trimitere ViewContent CAPI:", err));

            // 2. Facebook Pixel (Frontend) cu același Event ID pentru dedublare + valoare dinamică
            if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'ViewContent', {
                    content_ids: [giveawayId],
                    value: Number(price) || 0,
                    currency: 'GBP'
                }, { eventID: eventId });
            }
        }
    }, [giveawayId]);
    // ------------------------------------------

    const handlePercentageSelection = (percentage: number) => {
        setActiveTab('bonus');
        setHighlightedDraw(percentage);
        
        // Scroll către card după un scurt delay pt render
        setTimeout(() => {
            const card = document.getElementById(`bonus-card-${percentage}`);
            if (card) {
                // Dacă suntem pe mobil, vrem să fie cât mai vizibil (center) 
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 150);

        // Eliminăm highlight-ul după 4 secunde
        setTimeout(() => {
            setHighlightedDraw(null);
        }, 4000);
    };

    const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#bonus')) {
            const match = hash.match(/#bonus-(\d+)/);
            if (match) {
                const percent = parseInt(match[1], 10);
                handlePercentageSelection(percent);
            } else if (hash === '#bonus') {
                setActiveTab('bonus');
            }
        }
    };

    useEffect(() => {
        window.addEventListener('hashchange', handleHashChange);
        
        // Listener pentru custom event (pentru cazul când hash-ul e deja identic)
        const handleCustomEvent = (e: any) => {
            if (e.detail) {
                handlePercentageSelection(e.detail);
            }
        };
        window.addEventListener('bonus-star-clicked', handleCustomEvent);
        
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener('bonus-star-clicked', handleCustomEvent);
        };
    }, []);

    const wonCount = prizes.filter(p => p.is_won).length;
    const totalCount = prizes.length;

    const tabs = [
        {
            id: 'prizes',
            label: t('instantPrizes'),
            content: prizes.length > 0 ? (
                <div>
                    {/* Statistică câștiguri */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-black/60 uppercase tracking-widest">
                            {t('instantWinTitle')}
                        </h3>
                        <span className="text-xs font-semibold text-[#00A5FF] bg-[#00A5FF]/10 border border-[#00A5FF]/20 px-3 py-1 rounded-full">
                            {t('instantWinWonCount', { won: wonCount, total: totalCount })}
                        </span>
                    </div>

                    {/* Grid de carduri */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {prizes.map((prize, i) => (
                            <InstantPrizeCard key={i} prize={prize} t={t} />
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-black/40 text-sm italic py-4">{t('instantWinNoPrizes')}</p>
            )
        },
        {
            id: 'description',
            label: t('description'),
            content: description ? (
                <div
                    className="text-black/70 text-sm md:text-base leading-relaxed prose max-w-none prose-p:my-4 prose-strong:text-[#00A5FF] prose-headings:text-black"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            ) : (
                <p className="text-black/40 text-sm italic py-4">{t('comingSoon')}...</p>
            )
        },
        {
            id: 'details',
            label: t('competitionDetails'),
            content: competitionDetails ? (
                <div
                    className="text-black/70 text-sm md:text-base leading-relaxed prose max-w-none prose-p:my-4 prose-strong:text-[#00A5FF]"
                    dangerouslySetInnerHTML={{ __html: competitionDetails }}
                />
            ) : (
                <p className="text-black/40 text-sm italic py-4">{t('comingSoon')}...</p>
            )
        },
        {
            id: 'bonus',
            label: t('bonusDraw'),
            content: bonusDraws && bonusDraws.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                    {bonusDraws.map((draw, i) => (
                        <BonusDrawCard 
                            key={i} 
                            draw={draw} 
                            t={t} 
                            isHighlighted={highlightedDraw === draw.percentage}
                        />
                    ))}
                </div>
            ) : bonusDraw ? (
                <div
                    className="text-black/70 text-sm md:text-base leading-relaxed prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: bonusDraw }}
                />
            ) : (
                <div className="flex items-center gap-4 p-6 bg-[#00A5FF]/5 border border-[#00A5FF]/20 rounded-md">
                    <div className="w-3 h-3 bg-[#00A5FF] rounded-full animate-pulse shadow-[0_0_10px_rgba(0,165,255,0.5)]" />
                    <p className="text-[#00A5FF] text-base font-semibold tracking-wide italic">
                        {t('comingSoon')}...
                    </p>
                </div>
            )
        }
    ];

    return (
        <div id="bonus-info-container" className="mt-12 w-full mx-auto space-y-6">
            {/* Bara de navigare a taburilor */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 overflow-x-auto py-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            min-w-[120px] md:min-w-[160px] py-3 px-5 text-center text-[10px] md:text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 rounded-md border
                            ${activeTab === tab.id
                                ? 'bg-[#00A5FF] text-white border-[#00A5FF] shadow-[0_4px_15px_rgba(0,165,255,0.3)] scale-[1.05]'
                                : 'bg-white text-black/40 border-gray-200 hover:border-[#00A5FF]/40 hover:text-black/70'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Panoul de conținut */}
            <div className="border border-gray-200 bg-white/50 rounded-lg p-6 md:p-12 min-h-[250px] shadow-2xl">
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </div>
    );
}
