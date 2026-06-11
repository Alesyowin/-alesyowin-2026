"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface CategoryGiveawayCardProps {
    id: string;
    title: string;
    subtitle?: string;
    price: number;
    imageUrl: string;
    locale: string;
}

// Cartonaș produs pentru paginile de categorie
export default function CategoryGiveawayCard({
    id, title, subtitle, price, imageUrl, locale,
}: CategoryGiveawayCardProps) {
    const t = useTranslations('Home');

    return (
        <Link 
            href={`/${locale}/giveaway/${id}`}
            className="group block h-full relative bg-[#0A0A0A] border border-[#00A5FF]/15 rounded-lg overflow-hidden hover:border-[#00A5FF]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,165,255,0.1)] cursor-pointer md:flex md:flex-col"
        >
            {/* Imaginea produsului */}
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#111]">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
            </div>

            {/* Conținut */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Zonă Titlu - Înălțime fixă pentru aliniere (aprox 3 rânduri + subtitlu) */}
                <div className="min-h-[88px] mb-4">
                    <h3 className="text-white font-black text-lg uppercase tracking-wide leading-tight group-hover:text-[#00A5FF] transition-colors duration-300 line-clamp-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {title}
                    </h3>
                    {subtitle && <p className="text-[#00A5FF]/50 text-xs mt-1 line-clamp-1">{subtitle}</p>}
                </div>

                {/* Secțiune Bottom - Împinsă la bază */}
                <div className="mt-auto space-y-4">
                    {/* Preț centrat deasupra butonului */}
                    <div className="text-center">
                        <span className="text-[#00A5FF] font-black text-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>£{Number(price).toFixed(2)}</span>
                    </div>

                    {/* Buton Participă */}
                    <div
                        className="block w-full text-center py-3 rounded-md text-sm font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-[#008ecc] via-[#00A5FF] to-[#3498db] btn-gold-safe text-black hover:shadow-[0_0_25px_rgba(0,165,255,0.4)] hover:scale-[1.02] transition-all duration-300"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {t('enterNow')}
                    </div>
                </div>
            </div>
        </Link>
    );
}
