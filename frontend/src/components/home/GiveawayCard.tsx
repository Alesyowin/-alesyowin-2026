"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useState } from 'react';
import CountdownTimer from '../giveaway/CountdownTimer';

interface GiveawayCardProps {
    id: string;
    title: string;
    subtitle?: string;
    price: number;
    imageUrl: string;
    ticketsSold: number;
    totalTickets: number;
    endDate: string;
    locale: string;
    animate?: boolean;
}

export default function GiveawayCard({
    id, title, subtitle, price, imageUrl, ticketsSold, totalTickets, endDate, locale, animate = false,
}: GiveawayCardProps) {
    const t = useTranslations('Home');
    const [isHovered, setIsHovered] = useState(false);
    const percent = totalTickets > 0 ? Math.min(100, Math.round((ticketsSold / totalTickets) * 100)) : 0;

    return (
        <Link 
            href={`/${locale}/giveaway/${id}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group block h-full relative bg-[#111] border border-[#00A5FF] rounded-2xl overflow-hidden hover:border-[#008ecc] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,165,255,0.15)] hover:-translate-y-2 cursor-pointer"
        >
            <motion.div
                initial={animate ? { opacity: 0, y: 50 } : {}}
                whileInView={animate ? { opacity: 1, y: 0 } : {}}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
            >
            
            {/* Imaginea produsului */}
            <div className="relative w-full h-[240px] overflow-hidden border-b border-gray-800">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Badge preț */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-[#00A5FF]/30 rounded-lg px-4 py-2 flex items-center justify-center shadow-sm">
                    <span className="text-[#00A5FF] font-black text-xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        £{Number(price).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Conținut */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between text-center">
                {/* Titlu și subtitlu */}
                <div>
                    <h3
                        className="text-gray-100 font-extrabold text-lg uppercase tracking-wide leading-snug group-hover:text-[#00A5FF] transition-colors duration-300 line-clamp-2 min-h-[50px]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-gray-400 text-sm mt-2 line-clamp-1">{subtitle}</p>
                    )}
                </div>

                {/* Timer și Bara de progres */}
                <div className="space-y-4 mt-auto">
                    {/* Timer */}
                    <div>
                        <CountdownTimer endDate={endDate} isSoldOut={ticketsSold >= totalTickets} />
                    </div>

                    {/* Bara de progres interior */}
                    <div className="text-left w-full">
                        <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                            <span>{ticketsSold} SOLD</span>
                            <span>{totalTickets} TOTAL</span>
                        </div>
                        <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                            <div
                                className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${Math.max(2, percent)}%`,
                                    backgroundColor: '#00A5FF'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Buton Enter Now */}
                <div
                    className="
                        mt-4 flex items-center justify-center w-full text-center py-3.5 rounded-lg text-sm font-extrabold uppercase tracking-[0.1em]
                        bg-[#00A5FF] text-white
                        hover:bg-[#008ecc] hover:shadow-[0_6px_15px_rgba(0,165,255,0.4)]
                        transition-all duration-300
                    "
                    style={{ 
                        fontFamily: "'Montserrat', sans-serif"
                    }}
                >
                    {t('enterNow')}
                </div>
            </div>
          </motion.div>
        </Link>
    );
}
