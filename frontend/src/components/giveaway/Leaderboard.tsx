"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

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
        <div className="w-full mt-4 mb-5 bg-white border border-gray-200 rounded-lg shadow-[0_2px_5px_rgba(0,0,0,0.05)] overflow-hidden font-sans">
            <div className="bg-white px-4 py-5 text-center border-b border-gray-100">
                <h3 className="text-lg font-black text-black uppercase tracking-wide m-0">TOP PARTICIPANTS</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                    <thead>
                        <tr>
                            <th className="bg-[#222] text-white font-semibold py-3 px-2 text-center text-[11px] uppercase w-[15%]">#</th>
                            <th className="bg-[#222] text-white font-semibold py-3 px-4 text-left text-[11px] uppercase">{t('leaderboardName')}</th>
                            <th className="bg-[#222] text-white font-semibold py-3 px-2 text-center text-[11px] uppercase">{t('leaderboardTickets')}</th>
                            <th className="bg-[#222] text-white font-semibold py-3 px-2 text-center text-[11px] uppercase">{t('leaderboardPrize')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((user, index) => {
                            const rank = index + 1;
                            
                            // Găsim premiul configurat pentru acest rank
                            const prize = prizesConfig.find(p => p.rank === rank) || prizesConfig[index];

                            let rowClass = "bg-white border-b border-gray-50";
                            let rankDisplay: string | number = rank;
                            let prizeHtml: React.ReactNode = prize ? <span className="inline-block px-2 py-1 rounded text-[11px] font-black bg-gray-100 text-gray-700 border border-gray-200">{prize.amount}</span> : null;

                            if (rank === 1) {
                                rowClass = "bg-[#fffbe6] border-l-4 border-l-[#FFD700] border-b border-gray-50";
                                rankDisplay = "🥇";
                                if (prize) prizeHtml = <span className="inline-block px-2 py-1 rounded text-[11px] font-black bg-[#FFD700]/15 text-[#b48600] border border-[#b48600]/20">{prize.amount}</span>;
                            } else if (rank === 2) {
                                rowClass = "bg-[#fcfcfc] border-l-4 border-l-[#C0C0C0] border-b border-gray-50";
                                rankDisplay = "🥈";
                                if (prize) prizeHtml = <span className="inline-block px-2 py-1 rounded text-[11px] font-black bg-[#C0C0C0]/20 text-[#555] border border-[#C0C0C0]/40">{prize.amount}</span>;
                            } else if (rank === 3) {
                                rowClass = "bg-[#fff8f0] border-l-4 border-l-[#CD7F32] border-b border-gray-50";
                                rankDisplay = "🥉";
                                if (prize) prizeHtml = <span className="inline-block px-2 py-1 rounded text-[11px] font-black bg-[#CD7F32]/15 text-[#a05a1c] border border-[#a05a1c]/20">{prize.amount}</span>;
                            } else if (rank === 4) {
                                rowClass = "bg-[#f4f7fa] border-l-4 border-l-[#5a6e8c] border-b border-gray-50";
                                rankDisplay = "4";
                                if (prize) prizeHtml = <span className="inline-block px-2 py-1 rounded text-[11px] font-black bg-[#5a6e8c]/15 text-[#405065] border border-[#5a6e8c]/30">{prize.amount}</span>;
                            }

                            return (
                                <tr key={index} className={rowClass}>
                                    <td className="py-2.5 px-2 text-center text-[#333] font-medium">{rankDisplay}</td>
                                    <td className="py-2.5 px-4 text-left text-[#333] font-semibold">{user.name}</td>
                                    <td className="py-2.5 px-2 text-center text-[#333] font-medium">{user.count}</td>
                                    <td className="py-2.5 px-2 text-center">{prizeHtml}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
