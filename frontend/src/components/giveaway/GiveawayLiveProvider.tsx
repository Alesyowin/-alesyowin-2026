"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Normalize JSON arrays
function normalizeArray<T>(raw: any): T[] {
    if (!raw) return [];
    let parsed = raw;
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch { return []; }
    }
    if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch { return []; }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed;
}

export interface InstantPrize {
    ticket_number: number;
    prize_amount: number;
    prize_currency: string;
    winner_name: string | null;
    is_won: boolean;
}

export interface BonusDraw {
    percentage: number;
    prize_amount: number;
    prize_currency: string;
    winner_name?: string | null;
    winner_ticket?: number | string | null;
    is_won: boolean;
}

interface GiveawayLiveState {
    prizes: InstantPrize[];
    bonusDraws: BonusDraw[];
    ticketsSold: number;
}

const GiveawayLiveContext = createContext<GiveawayLiveState | undefined>(undefined);

export function GiveawayLiveProvider({
    children,
    giveawayId,
    initialPrizes,
    initialBonusDraws,
    initialTicketsSold,
}: {
    children: React.ReactNode;
    giveawayId: string;
    initialPrizes: any;
    initialBonusDraws: any;
    initialTicketsSold: number;
}) {
    const [state, setState] = useState<GiveawayLiveState>(() => ({
        prizes: normalizeArray<InstantPrize>(initialPrizes),
        bonusDraws: normalizeArray<BonusDraw>(initialBonusDraws),
        ticketsSold: initialTicketsSold,
    }));

    useEffect(() => {
        if (!giveawayId) return;

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/instant-prizes?giveawayId=${giveawayId}`, {
                    cache: 'no-store',
                });
                if (!res.ok) return;
                const data = await res.json();
                
                setState(prev => ({
                    prizes: Array.isArray(data.prizes) ? normalizeArray<InstantPrize>(data.prizes) : prev.prizes,
                    bonusDraws: Array.isArray(data.bonusDraws) ? normalizeArray<BonusDraw>(data.bonusDraws) : prev.bonusDraws,
                    ticketsSold: typeof data.ticketsSold === 'number' && data.ticketsSold !== 0 ? data.ticketsSold : prev.ticketsSold,
                }));
            } catch (error) {
                // Păstrăm datele existente la eroare
            }
        };

        // Polling la 15 secunde (același comportament de până acum din GiveawayInformation.tsx)
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [giveawayId]);

    return (
        <GiveawayLiveContext.Provider value={state}>
            {children}
        </GiveawayLiveContext.Provider>
    );
}

export function useGiveawayLive() {
    const context = useContext(GiveawayLiveContext);
    if (context === undefined) {
        throw new Error("useGiveawayLive must be used within a GiveawayLiveProvider");
    }
    return context;
}
