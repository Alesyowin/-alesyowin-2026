"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useGiveawayLive } from './GiveawayLiveProvider';
import { HelpCircle, Star, X } from 'lucide-react';

interface ProgressBarProps {
    ticketsSold: number;
    totalTickets: number;
}

export default function ProgressBar({ ticketsSold: staticTicketsSold, totalTickets }: ProgressBarProps) {
    const t = useTranslations('Giveaway');
    const tPage = useTranslations('GiveawayPage');
    
    // Attempt to use context, fallback to static props
    let liveSold = staticTicketsSold;
    let bonusDraws: any[] = [];
    try {
        const liveState = useGiveawayLive();
        liveSold = liveState.ticketsSold;
        bonusDraws = liveState.bonusDraws || [];
    } catch (e) {
        // Not in provider
    }

    const percent = Math.min(100, Math.round((liveSold / Math.max(1, totalTickets)) * 100));
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Calculate next bonus draw
    let nextDraw = null;
    let percentToGo = 0;
    
    if (bonusDraws.length > 0) {
        // The DB field is 'percentage'
        const sorted = [...bonusDraws].sort((a, b) => (a.percentage || 0) - (b.percentage || 0));
        nextDraw = sorted.find(d => !d.is_won && (d.percentage || 0) > percent);
        if (nextDraw) {
            percentToGo = nextDraw.percentage - percent;
        }
    }

    const handleStarClick = (percentage: number) => {
        // Punem hash-ul specific
        window.location.hash = `bonus-${percentage}`;
        
        // În caz că hash-ul e deja același și vrem să se mai facă o dată trigger la animație,
        // putem emite și un event custom:
        window.dispatchEvent(new CustomEvent('bonus-star-clicked', { detail: percentage }));
        
        // Asigurăm un scroll general către secțiune în caz că tab-ul era deja deschis 
        // dar vrem să ajungem la el. Scroll-ul precis către card se va face din interiorul GiveawayInformation
        const el = document.getElementById('bonus-info-container');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="w-full pt-10 pb-4">
            {/* Main Progress Container */}
            <div className="relative w-full h-4 bg-[#1a1a1a] rounded-full border border-white/5">
                {/* Gold Fill */}
                <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out z-10"
                    style={{
                        width: `${percent}%`,
                        background: 'linear-gradient(90deg, #8b6914 0%, #D4AF37 60%, #f0d060 100%)',
                        boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
                    }}
                />

                {/* Progress Bubble (Indicator) */}
                <div 
                    className="absolute top-0 -translate-y-[110%] -translate-x-1/2 z-30 transition-all duration-700 ease-out"
                    style={{ left: `${percent}%` }}
                >
                    <div className="relative bg-[#D4AF37] btn-gold-safe text-black px-3 py-1.5 rounded-full flex flex-col items-center justify-center min-w-[65px] shadow-[0_4px_10px_rgba(212,175,55,0.4)]">
                        <span className="text-[14px] font-black leading-none">{percent}%</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter leading-none mt-0.5">SOLD</span>
                        {/* Little triangle pointer */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#D4AF37]"></div>
                    </div>
                </div>

                {/* Stars for bonus draws */}
                {bonusDraws.map((draw, i) => {
                    const drawPercent = draw.percentage || 0;
                    const achieved = percent >= drawPercent || draw.is_won;
                    
                    return (
                        <div 
                            key={i}
                            onClick={() => handleStarClick(drawPercent)}
                            className={`
                                absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 cursor-pointer 
                                flex items-center justify-center rounded-full transition-all duration-300
                                w-5 h-5 md:w-6 md:h-6
                                ${achieved 
                                    ? 'bg-[#D4AF37] btn-gold-safe shadow-[0_0_15px_rgba(212,175,55,0.5)] scale-110' 
                                    : 'bg-[#1a1a1a] border border-white/10 hover:border-[#D4AF37]/40'
                                }
                            `}
                            style={{ left: `${drawPercent}%` }}
                            title={`${drawPercent}% Bonus Draw`}
                        >
                            <Star 
                                size={achieved ? 12 : 10} 
                                fill={achieved ? "white" : "transparent"}
                                className={achieved ? "text-white" : "text-white/20"}
                                strokeWidth={achieved ? 0 : 2.5}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Labels and Modal button UI */}
            <div className="flex flex-col items-center mt-8 space-y-3">
                <div className="flex items-center justify-between w-full">
                    <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
                        {t('ticketsSold')}: <span className="text-white/80">{liveSold.toLocaleString()}</span>
                    </span>
                    <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
                        {tPage.rich('entriesInfo', { 
                            count: totalTickets.toLocaleString(),
                            strong: (chunks) => <strong>{chunks}</strong>
                        })}
                    </span>
                </div>

                {nextDraw && (
                    <p className="text-[#D4AF37] font-black text-sm tracking-[0.1em] text-center uppercase">
                        {tPage('bonusDrawsGoText', { percent: percentToGo })}
                    </p>
                )}

                <div className="flex items-center gap-2">
                    <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest">
                        {tPage('bonusDrawsTakePlaceText')}
                    </p>
                    <button 
                        onClick={() => setIsMenuOpen(true)}
                        className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] rounded-full p-1 transition-all"
                    >
                        <HelpCircle size={14} />
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-[#D4AF37]/30 rounded-xl p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => setIsMenuOpen(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h4 className="text-[#D4AF37] font-black text-xl mb-4 uppercase tracking-[0.1em] flex items-center gap-3">
                            <Star fill="#D4AF37" size={20} />
                            {tPage('bonusDrawsExplanation')}
                        </h4>
                        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                            {tPage('bonusDrawsModalText')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
