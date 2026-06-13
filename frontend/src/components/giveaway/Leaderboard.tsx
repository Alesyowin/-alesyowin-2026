"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, Ticket, Award } from 'lucide-react';

export default function Leaderboard({ giveawayId }: { giveawayId?: string }) {
    const t = useTranslations('GiveawayPage');
    const [participants, setParticipants] = useState<{name: string, count: number}[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [prizesConfig, setPrizesConfig] = useState<any[]>([]);

    useEffect(() => {
        if (!giveawayId) return;

        const fetchLeaderboard = async () => {
            try {
                // Preia datele de la endpointul custom Directus
                const res = await fetch(`https://alesyowin-backend.onrender.com/directus-extension-leaderboard/${giveawayId}`);
                if (!res.ok) {
                    throw new Error('Failed to fetch leaderboard');
                }
                const json = await res.json();
                if (json.success) {
                    setParticipants(json.data || []);
                    if (json.prizes) {
                        setPrizesConfig(json.prizes);
                    } else {
                        // Fallback la premiile din codul vechi Shopify
                        setPrizesConfig([
                            { rank: 1, amount: "5.000 €" },
                            { rank: 2, amount: "3.000 €" },
                            { rank: 3, amount: "2.000 €" },
                            { rank: 4, amount: "500 €" }
                        ]);
                    }
                } else {
                    throw new Error(json.error || 'API Error');
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [giveawayId]);

    if (loading) {
        return (
            <div className="p-8 text-center text-black/50 text-sm">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 text-sm">
                Error loading participants.
            </div>
        );
    }

    if (participants.length === 0) {
        return (
            <div className="p-8 text-center text-black/50 text-sm">
                {t('leaderboardEmpty')}
            </div>
        );
    }

    return (
        <div className="w-full mt-4 mb-8 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden font-sans border border-gray-100">
            {/* Header */}
            <div className="bg-black px-6 py-8 text-center relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A5FF]/20 via-transparent to-transparent opacity-60"></div>
                <Trophy size={32} className="text-[#00A5FF] mb-3 relative z-10 drop-shadow-[0_0_15px_rgba(0,165,255,0.6)]" />
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-[0.2em] relative z-10 m-0">
                    Top Participanți
                </h3>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00A5FF] to-transparent"></div>
            </div>
            
            <div className="p-3 md:p-6 space-y-3">
                {/* Tabel Header (Desktop) */}
                <div className="hidden md:flex items-center px-6 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 mb-4">
                    <div className="w-16 text-center">Rank</div>
                    <div className="flex-1">{t('leaderboardName')}</div>
                    <div className="w-32 text-center">{t('leaderboardTickets')}</div>
                    <div className="w-32 text-right">{t('leaderboardPrize')}</div>
                </div>

                {/* Rows */}
                <div className="flex flex-col space-y-3">
                    {participants.map((user, index) => {
                        const rank = index + 1;
                        
                        // Premiul alocat acestui loc
                        const prize = prizesConfig.find(p => p.rank === rank) || prizesConfig[index];
                        const isRewarded = rank <= 4;

                        // Styling implicit (locurile 5+)
                        let rowClass = "bg-white border border-gray-100 hover:border-[#00A5FF]/30 hover:shadow-md transition-all duration-300";
                        let rankBadgeClass = "bg-gray-50 text-gray-400 border border-gray-200";
                        let nameClass = "text-black";
                        let ticketsLabelClass = "text-gray-400";
                        let ticketsCountClass = "text-black";
                        let prizeClass = "bg-gray-50 text-gray-400 border border-gray-100";
                        let rankDisplay: React.ReactNode = rank;
                        
                        // Styling specific pentru primele 4 locuri
                        if (rank === 1) {
                            rowClass = "bg-black border border-[#00A5FF] md:scale-[1.02] shadow-[0_10px_30px_rgba(0,165,255,0.25)] z-20 relative";
                            rankBadgeClass = "bg-[#00A5FF] text-white shadow-[0_0_15px_rgba(0,165,255,0.6)] border-none";
                            nameClass = "text-white text-lg";
                            ticketsLabelClass = "text-white/50";
                            ticketsCountClass = "text-[#00A5FF] text-xl drop-shadow-[0_0_8px_rgba(0,165,255,0.4)]";
                            prizeClass = "bg-gradient-to-r from-[#00A5FF] to-[#005A99] text-white border-none shadow-[0_0_15px_rgba(0,165,255,0.4)]";
                            rankDisplay = <Trophy size={14} className="text-white" />;
                        } else if (rank === 2) {
                            rowClass = "bg-gray-900 border border-gray-800 shadow-xl z-10 relative";
                            rankBadgeClass = "bg-white text-black border-none";
                            nameClass = "text-white";
                            ticketsLabelClass = "text-white/50";
                            ticketsCountClass = "text-white";
                            prizeClass = "bg-white text-black border-none shadow-[0_0_10px_rgba(255,255,255,0.2)]";
                            rankDisplay = "2";
                        } else if (rank === 3) {
                            rowClass = "bg-gray-800 border border-gray-700 shadow-lg relative";
                            rankBadgeClass = "bg-gray-200 text-black border-none";
                            nameClass = "text-white";
                            ticketsLabelClass = "text-white/50";
                            ticketsCountClass = "text-white";
                            prizeClass = "bg-gray-200 text-black border-none";
                            rankDisplay = "3";
                        } else if (rank === 4) {
                            rowClass = "bg-white border-2 border-[#00A5FF]/40 shadow-md relative";
                            rankBadgeClass = "bg-[#00A5FF]/10 text-[#00A5FF] border border-[#00A5FF]/20";
                            nameClass = "text-black font-extrabold";
                            ticketsLabelClass = "text-[#00A5FF]/60";
                            ticketsCountClass = "text-[#00A5FF]";
                            prizeClass = "bg-[#00A5FF]/10 text-[#00A5FF] border border-[#00A5FF]/20";
                            rankDisplay = "4";
                        }

                        return (
                            <div key={index} className={`flex items-center px-4 md:px-6 py-4 md:py-5 rounded-xl ${rowClass} group`}>
                                {/* Rank Badge */}
                                <div className="w-12 md:w-16 flex justify-center shrink-0">
                                    <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-black text-sm md:text-base ${rankBadgeClass}`}>
                                        {rankDisplay}
                                    </div>
                                </div>

                                {/* Nume */}
                                <div className={`flex-1 font-bold text-sm md:text-base truncate px-3 md:px-4 ${nameClass}`}>
                                    {user.name}
                                </div>

                                {/* Bilete */}
                                <div className="w-24 md:w-32 flex flex-col items-center justify-center shrink-0">
                                    <span className={`text-[9px] md:text-[10px] uppercase font-black tracking-[0.2em] mb-1 ${ticketsLabelClass}`}>TICKETS</span>
                                    <div className={`flex items-center gap-1.5 font-black text-base md:text-lg ${ticketsCountClass}`}>
                                        <Ticket size={14} className={rank === 1 ? 'text-[#00A5FF]' : (rank <= 3 ? 'text-white/70' : 'text-gray-400')} />
                                        {user.count}
                                    </div>
                                </div>

                                {/* Premiu */}
                                <div className="w-28 md:w-32 flex justify-end shrink-0">
                                    {prize && isRewarded ? (
                                        <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-black whitespace-nowrap tracking-wide flex items-center gap-1.5 ${prizeClass}`}>
                                            <Award size={14} />
                                            {prize.amount}
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-xs font-bold px-4">-</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
