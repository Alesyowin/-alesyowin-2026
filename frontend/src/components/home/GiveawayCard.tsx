"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useState } from 'react';
import CountdownTimer from '../giveaway/CountdownTimer';
import BorderBeam from '../ui/BorderBeam';

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
    animate?: boolean; // Prop nou pentru activarea animației
}

// Cartonaș produs giveaway pentru pagina principală
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
            className="group block h-full relative bg-[#0A0A0A] border border-[#D4AF37]/15 rounded-lg overflow-hidden hover:border-[#D4AF37]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] cursor-pointer"
        >
            {/* Efectul de Border Beam (Glow animat pe margini) */}
            <BorderBeam isHovered={isHovered} />

            <motion.div
                initial={animate ? { opacity: 0, y: 50 } : {}}
                whileInView={animate ? { opacity: 1, y: 0 } : {}}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full h-full md:flex md:flex-col"
            >
            
            {/* Imaginea produsului */}
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#111]">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/0 to-[#0A0A0A]/0 opacity-60" />
                
                {/* Badge preț */}
                <div className="absolute top-3 right-3 bg-black/80 border border-[#D4AF37]/30 rounded-md px-3 py-1.5 flex items-center justify-center min-w-[3.5rem]">
                    <span className="text-[#D4AF37] font-black text-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        £{Number(price).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Conținut */}
            <div className="p-5 space-y-4 md:flex-1 md:flex md:flex-col">
                {/* Titlu și subtitlu */}
                <div>
                    <h3
                        className="text-white font-black text-xl uppercase tracking-wide leading-tight group-hover:text-[#D4AF37] transition-colors duration-300"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[#D4AF37]/50 text-sm mt-1 line-clamp-1">{subtitle}</p>
                    )}
                </div>

                {/* Timer și Bara de progres */}
                <div className="space-y-4 md:mt-auto">
                    {/* Timer (scalat pentru a încăpea perfect în cartonaș) */}
                    <div className="transform origin-left scale-75 w-[133%] -mb-2">
                        <CountdownTimer endDate={endDate} isSoldOut={ticketsSold >= totalTickets} />
                    </div>

                    {/* Bara de progres interior */}
                    <div className="relative w-full h-5 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#D4AF37]/10">
                        <div
                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                            style={{
                                width: `${Math.max(8, percent)}%`, // Asigurăm minim de lățime pt a face procentajul vizibil dacă îl punem înăuntru
                                background: 'linear-gradient(90deg, #8b6914 0%, #D4AF37 60%, #f0d060 100%)',
                                boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)',
                            }}
                        >
                            {percent > 5 && <span className="text-white font-black text-[10px]">{percent}%</span>}
                        </div>
                        {percent <= 5 && <span className="absolute top-1/2 -translate-y-1/2 left-2 text-white font-black text-[10px]">{percent}%</span>}
                    </div>
                </div>

                {/* Buton Enter Now (acum este vizual, clicul fiind gestionat de întregul card) */}
                <div
                    className="
                        flex items-center justify-center w-full text-center py-3.5 rounded-md text-sm font-bold uppercase tracking-[0.2em]
                        bg-gradient-to-r from-[#8b6914] via-[#D4AF37] to-[#f0d060] btn-gold-safe text-black
                        hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-[1.02]
                        transition-all duration-300 btn-gold-safe
                    "
                    style={{ 
                        fontFamily: "'Montserrat', sans-serif",
                        backgroundColor: '#D4AF37',
                        opacity: 1,
                        visibility: 'visible',
                        zIndex: 999,
                        position: 'relative',
                        display: 'inline-block'
                    }}
                >
                    {t('enterNow')}
                </div>
            </div>
          </motion.div>
        </Link>
    );
}
