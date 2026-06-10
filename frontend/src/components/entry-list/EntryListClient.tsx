"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { getDirectusFileUrl } from '../../lib/directus';

interface GiveawayItem {
    id: string;
    title: string;
    subtitle?: string;
    status?: string;
    category?: string;
    tickets_sold: number;
    total_tickets: number;
    images?: { id: string; directus_files_id: string | { id: string } }[];
}

interface EntryListClientProps {
    giveaways: GiveawayItem[];
}

export default function EntryListClient({ giveaways }: EntryListClientProps) {
    const t = useTranslations('EntryList');
    const locale = useLocale();
    const [activeCategory, setActiveCategory] = useState('all');

    // Categoriile disponibile pentru filtrare
    const categories = [
        { key: 'all', label: t('all') },
        { key: 'cars', label: t('cars') },
        { key: 'apartments', label: t('apartments') },
        { key: 'cash', label: t('cash') },
        { key: 'tech', label: t('tech') },
    ];

    // Filtrarea obiectelor
    const filteredGiveaways = giveaways.filter((giveaway) => {
        if (activeCategory === 'all') return true;
        // Funcția de filtru compară tag-ul categoriei din butoane direct cu cel din datele directe (cars, apartments, etc)
        return giveaway.category?.toLowerCase() === activeCategory;
    });

    return (
        <div className="space-y-8">
            {/* Filtre categorii */}
            <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold border rounded-sm transition-all duration-300 ${
                            activeCategory === cat.key
                                ? 'bg-gradient-to-r from-[#8b6914] via-[#D4AF37] to-[#f0d060] btn-gold-safe text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                : 'bg-[#0A0A0A] border-[#D4AF37]/20 text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/50'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Grid Giveaways */}
            {filteredGiveaways.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGiveaways.map((giveaway) => {
                        const isSoldOut = giveaway.tickets_sold >= giveaway.total_tickets;
                        const displayActive = !isSoldOut;

                        // Construim URL-ul imaginii sau folosim un placeholder
                        const firstImage = giveaway.images?.[0];
                        const fileId = firstImage 
                            ? (typeof firstImage.directus_files_id === 'string' 
                                ? firstImage.directus_files_id 
                                : firstImage.directus_files_id.id)
                            : null;
                        
                        const imageUrl = fileId ? getDirectusFileUrl(fileId, { width: 600, quality: 80 }) : null;

                        return (
                            <div
                                key={giveaway.id}
                                className="group bg-[#0A0A0A] border border-[#D4AF37]/10 rounded-sm overflow-hidden hover:border-[#D4AF37]/30 transition-all flex flex-col h-full"
                            >
                                {/* Event Image Container */}
                                <div className="relative w-full aspect-[16/9] bg-[#111] overflow-hidden border-b border-[#D4AF37]/10">
                                    {imageUrl ? (
                                        <img 
                                            src={imageUrl} 
                                            alt={giveaway.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/20 text-5xl">
                                            🏆
                                        </div>
                                    )}
                                    {/* Overlay status badge on top of image */}
                                    <div className="absolute top-3 right-3">
                                        <span
                                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md ${
                                                displayActive
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-black/40 text-white/40 border border-white/10'
                                            }`}
                                        >
                                            {displayActive ? t('active') : t('finished')}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-1 gap-4">
                                    <div className="space-y-2">
                                        <h3
                                            className="text-white font-bold uppercase tracking-wide text-sm truncate"
                                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                                        >
                                            {giveaway.title}
                                        </h3>
                                        
                                        <div className="text-white/40 text-xs flex items-center gap-2">
                                            <span className="text-[#D4AF37]">🎫</span>
                                            {giveaway.tickets_sold.toLocaleString()} / {giveaway.total_tickets.toLocaleString()} {t('tickets')}
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <Link
                                            href={`/${locale}/entry-list/${giveaway.id}`}
                                            className="block w-full text-center py-2.5 text-xs font-bold uppercase tracking-[0.15em] bg-[#111] border border-[#D4AF37]/20 text-[#D4AF37] rounded-sm hover:bg-[#D4AF37]/10hover:border-[#D4AF37]/50 transition-all"
                                        >
                                            {t('viewTickets')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-white/30">
                    <p>{t('noCompetitions')}</p>
                </div>
            )}
        </div>
    );
}
