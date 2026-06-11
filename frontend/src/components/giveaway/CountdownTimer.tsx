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
          w-14 h-14 md:w-16 md:h-16
          text-xl md:text-2xl font-black text-[#00A5FF]
          bg-white rounded-lg border border-[#00A5FF]/20
          shadow-sm
        "
                style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
                <Pad n={value} />
            </div>
            <span className="text-[9px] md:text-[10px] tracking-[0.2em] text-gray-500 uppercase mt-2">
                {label}
            </span>
        </div>
    );

    const colon = (
        <div className="flex h-14 md:h-16 items-center">
            <span className="text-[#00A5FF] text-xl md:text-2xl font-black pb-1">:</span>
        </div>
    );

    // Dacă lipsește endDate complet, desenăm ceasul cu "–-" pentru a nu strica layout-ul
    if (!endDate) {
        return (
            <div className="flex items-start gap-1.5 md:gap-2 justify-center">
                {unit(t('days'), '--')}
                {colon}
                {unit(t('hours'), '--')}
                {colon}
                {unit(t('min'), '--')}
                {colon}
                {unit(t('sec'), '--')}
            </div>
        );
    }

    // While mounting pe client, arătăm Skeleton
    if (!timeLeft) {
        return (
            <div className="flex items-start gap-1.5 md:gap-2 justify-center">
                {['--', '--', '--', '--'].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-white border border-[#00A5FF]/10 rounded-lg animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-start gap-1.5 md:gap-2 justify-center">
            {unit(t('days'), timeLeft.days)}
            {colon}
            {unit(t('hours'), timeLeft.hours)}
            {colon}
            {unit(t('min'), timeLeft.minutes)}
            {colon}
            {unit(t('sec'), timeLeft.seconds)}
        </div>
    );
}
