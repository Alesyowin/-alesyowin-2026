"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface CountdownTimerProps {
    endDate?: string | null;
    isSoldOut?: boolean;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calculateTimeLeft(endDate: string): TimeLeft | null {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

function Pad({ n }: { n: number | string }) {
    return <span>{typeof n === 'number' ? String(n).padStart(2, '0') : n}</span>;
}

export default function CountdownTimer({ endDate, isSoldOut }: CountdownTimerProps) {
    const t = useTranslations('Timer');
    // Initialize as null so server and client SSR match (avoids hydration error from Date.now())
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    useEffect(() => {
        if (!endDate) return;

        // Calculate on mount immediately, then continue every second
        setTimeLeft(calculateTimeLeft(endDate));
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(endDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [endDate]);

    // Dacă este vizibil 'Giveaway Ended' (Sold Out sau Expired din Timp)
    if (isSoldOut || (endDate && !timeLeft && new Date(endDate).getTime() < Date.now())) {
        return (
            <div className="text-center py-4 flex items-center justify-center min-h-[5rem]">
                <span className="text-xl md:text-2xl font-bold text-red-500 tracking-widest uppercase">
                    {t('ended')}
                </span>
            </div>
        );
    }

    // Funcție de randare a unui box
    const unit = (label: string, value: number | string) => (
        <div className="flex flex-col items-center">
            <div
                className="
          flex items-center justify-center
          w-16 h-16 md:w-20 md:h-20
          text-2xl md:text-3xl font-black text-[#00A5FF]
          bg-gray-50 rounded-sm border border-[#00A5FF]/20
          shadow-[inset_0_0_12px_rgba(0,165,255,0.08)]
        "
                style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
                <Pad n={value} />
            </div>
            <span className="text-[10px] md:text-xs tracking-[0.2em] text-black/40 uppercase mt-1">
                {label}
            </span>
        </div>
    );

    // Dacă lipsește endDate complet, desenăm ceasul cu "–-" pentru a nu strica layout-ul
    if (!endDate) {
        return (
            <div className="flex items-end gap-2 md:gap-4 justify-center">
                {unit(t('days'), '--')}
                <span className="text-[#00A5FF] text-2xl md:text-3xl font-black mb-4">:</span>
                {unit(t('hours'), '--')}
                <span className="text-[#00A5FF] text-2xl md:text-3xl font-black mb-4">:</span>
                {unit(t('min'), '--')}
                <span className="text-[#00A5FF] text-2xl md:text-3xl font-black mb-4">:</span>
                {unit(t('sec'), '--')}
            </div>
        );
    }

    // While mounting pe client, arătăm Skeleton
    if (!timeLeft) {
        // Loading skeleton - same size as the boxes
        return (
            <div className="flex items-end gap-2 md:gap-4 justify-center">
                {['--', '--', '--', '--'].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 border border-[#00A5FF]/10 rounded-sm animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-end gap-2 md:gap-4 justify-center">
            {unit(t('days'), timeLeft.days)}
            <span className="text-[#00A5FF] text-2xl md:text-3xl font-black mb-4">:</span>
            {unit(t('hours'), timeLeft.hours)}
            <span className="text-[#00A5FF] text-2xl md:text-3xl font-black mb-4">:</span>
            {unit(t('min'), timeLeft.minutes)}
            <span className="text-[#00A5FF] text-2xl md:text-3xl font-black mb-4">:</span>
            {unit(t('sec'), timeLeft.seconds)}
        </div>
    );
}
