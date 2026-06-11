"use client";

import { useState, useCallback, useEffect } from 'react';
import { Search, Ticket, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TicketResult {
    id: number;
    ticket_number: number;
    email: string;
    client_name?: string;
    order_id: number;
    date_created: string;
    is_winner?: boolean;
    prize_won?: string;
}

interface SearchResult {
    tickets: TicketResult[];
    customers?: { name: string; email: string }[];
    message?: string;
    error?: string;
}

interface EntryListSearchProps {
    giveawayId: string;
}

const formatRomanianDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const datePart = new Intl.DateTimeFormat('ro-RO', {
            timeZone: 'Europe/Bucharest',
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).format(date);
        
        const timePart = new Intl.DateTimeFormat('ro-RO', {
            timeZone: 'Europe/Bucharest',
            hour: '2-digit', minute: '2-digit', hour12: false
        }).format(date);
        
        return `${datePart} | ${timePart}`;
    } catch {
        return '';
    }
};

export default function EntryListSearch({ giveawayId }: EntryListSearchProps) {
    const t = useTranslations('EntryList');
    
    // Search states
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Table states
    const [allTickets, setAllTickets] = useState<TicketResult[]>([]);
    const [totalTickets, setTotalTickets] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingAll, setLoadingAll] = useState(false);
    const limit = 50;
    const totalPages = Math.ceil(totalTickets / limit);

    const fetchAllTickets = useCallback(async (page: number) => {
        setLoadingAll(true);
        try {
            const res = await fetch(`/api/all-tickets?giveawayId=${encodeURIComponent(giveawayId)}&page=${page}&limit=${limit}`);
            const data = await res.json();
            if (data.tickets) {
                setAllTickets(data.tickets);
                setTotalTickets(data.total || 0);
            }
        } catch (e) {
            console.error("Failed to fetch all tickets");
        } finally {
            setLoadingAll(false);
        }
    }, [giveawayId]);

    // Încărcare inițială tabel
    useEffect(() => {
        fetchAllTickets(currentPage);
    }, [currentPage, fetchAllTickets]);

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.trim().length < 1) return;

        setLoading(true);
        setSearched(true);

        try {
            const res = await fetch(
                `/api/search-tickets?giveawayId=${encodeURIComponent(giveawayId)}&name=${encodeURIComponent(searchQuery.trim())}`
            );
            const data = await res.json();
            setResults(data);
        } catch {
            setResults({ tickets: [], error: t('connectionError') });
        } finally {
            setLoading(false);
        }
    }, [giveawayId, t]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch(query);
    };

    // Funcție pentru a genera array de pagini (ex: 1 2 3...)
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const isSearchEmpty = query.trim().length === 0;

    return (
        <div className="space-y-8">
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00A5FF]/40 group-focus-within:text-[#00A5FF] transition-colors pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (e.target.value.trim().length === 0) setSearched(false);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={t('searchPlaceholder')}
                        className="
                            w-full pl-12 pr-4 py-4 text-base
                            bg-[#0A0A0A] border border-[#00A5FF]/20 rounded-sm
                            text-white placeholder-white/20
                            focus:outline-none focus:border-[#00A5FF]/60 focus:ring-1 focus:ring-[#00A5FF]/10
                            transition-all duration-300
                        "
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || query.trim().length < 1}
                    className={`
                        px-8 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-sm
                        transition-all duration-500 whitespace-nowrap
                        ${loading || query.trim().length < 1
                            ? 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#008ecc] via-[#00A5FF] to-[#3498db] btn-gold-safe text-black shadow-[0_4px_15px_rgba(0,165,255,0.2)] hover:shadow-[0_0_25px_rgba(0,165,255,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                        }
                    `}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                        t('searchBtn')
                    )}
                </button>
            </form>

            {/* TABEL PARTICIPANȚI (Arătat Doar Când Căutarea e Goală) */}
            {isSearchEmpty && (
                <div className="max-w-4xl mx-auto mt-12 animate-in fade-in duration-500">
                    {loadingAll ? (
                        <div className="text-center py-12 text-[#00A5FF]/60">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        </div>
                    ) : (
                        <div className="bg-[#0A0A0A] border border-[#00A5FF]/20 rounded-md overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-white">
                                    <thead className="bg-[#111] border-b border-[#00A5FF]/20 text-[#00A5FF] uppercase tracking-wider text-[11px] font-black">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-md">Ticket Number</th>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4 rounded-tr-md">Order ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {allTickets.map((ticket) => (
                                            <tr key={ticket.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 font-black tracking-widest text-[#00A5FF] whitespace-nowrap">
                                                    #{ticket.ticket_number}
                                                </td>
                                                <td className="px-6 py-4 text-white/80 truncate max-w-[200px] sm:max-w-xs font-medium">
                                                    {ticket.client_name || ticket.email.split('@')[0]}
                                                </td>
                                                <td className="px-6 py-4 text-white/40 text-xs whitespace-nowrap font-mono tracking-tight">
                                                    {formatRomanianDate(ticket.date_created)}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-white/30 group-hover:text-white/60 transition-colors text-xs whitespace-nowrap">
                                                    #{ticket.order_id}
                                                </td>
                                            </tr>
                                        ))}
                                        {allTickets.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-white/30 italic">
                                                    No entries found yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginare Simplă numerică */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 p-4 border-t border-[#00A5FF]/10 bg-[#050505]">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-sm text-[#00A5FF] hover:bg-[#00A5FF]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        &lt;
                                    </button>
                                    
                                    {getPageNumbers().map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setCurrentPage(num)}
                                            className={`
                                                w-8 h-8 flex items-center justify-center rounded-sm text-xs font-bold transition-colors
                                                ${currentPage === num 
                                                    ? 'bg-[#00A5FF] text-black shadow-[0_0_10px_rgba(0,165,255,0.4)]' 
                                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                                }
                                            `}
                                        >
                                            {num}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="w-8 h-8 flex items-center justify-center rounded-sm text-[#00A5FF] hover:bg-[#00A5FF]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* RESULTS SCREEN (Arătat Doar Când Căutarea NU e goală și s-a folosit submit) */}
            {!isSearchEmpty && searched && (
                <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
                    {loading && (
                        <div className="text-center py-12 text-white/40 space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00A5FF]/60" />
                            <p className="text-sm">{t('searching')}</p>
                        </div>
                    )}

                    {!loading && results && (
                        <>
                            {results.error && (
                                <div className="flex items-center gap-3 px-5 py-4 bg-red-900/20 border border-red-500/30 rounded-sm text-red-400">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm">{results.error}</p>
                                </div>
                            )}

                            {!results.error && results.tickets.length === 0 && (
                                <div className="text-center py-12 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                                        <Ticket className="w-7 h-7 text-white/20" />
                                    </div>
                                    <div>
                                        <p className="text-white/60 font-semibold">{t('noTicketsFound')}</p>
                                        <p className="text-white/30 text-sm mt-1">
                                            {t('tryAnother')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!results.error && results.tickets.length > 0 && (
                                <div className="space-y-4">
                                    {/* Summary Header */}
                                    <div className="flex items-center justify-between px-1">
                                        <div>
                                            <p className="text-white font-semibold">
                                                {t('ticketsFoundFor')}{' '}
                                                <span className="text-[#00A5FF]">"{query}"</span>
                                            </p>
                                            {results.tickets[0]?.client_name && (
                                                <p className="text-white/40 text-xs mt-0.5">
                                                    👤 {results.tickets[0].client_name}
                                                </p>
                                            )}
                                        </div>
                                        <span className="px-3 py-1 bg-[#00A5FF]/10 border border-[#00A5FF]/30 rounded-full text-[#00A5FF] text-sm font-bold">
                                            {t('ticketCount', { count: results.tickets.length })}
                                        </span>
                                    </div>

                                    {/* Ticket Grid */}
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                        {results.tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="
                                                    relative flex flex-col items-center justify-center py-6 px-1
                                                    bg-gradient-to-b from-[#3498db] via-[#00A5FF] to-[#008ecc]
                                                    rounded-md shadow-[0_0_15px_rgba(0,165,255,0.3)]
                                                    cursor-default transition-transform hover:scale-105
                                                "
                                            >
                                                {/* Corner Cutouts */}
                                                <div className="absolute -top-2 -left-2 w-5 h-5 bg-[#050505] rounded-full z-10" />
                                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#050505] rounded-full z-10" />
                                                <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-[#050505] rounded-full z-10" />
                                                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#050505] rounded-full z-10" />
                                                
                                                {/* Perforated Edges */}
                                                <div 
                                                    className="absolute -left-0.5 top-3 bottom-3 w-1.5 z-10" 
                                                    style={{ backgroundImage: 'radial-gradient(circle at 0 50%, #050505 3px, transparent 3.5px)', backgroundSize: '100% 14px' }} 
                                                />
                                                <div 
                                                    className="absolute -right-0.5 top-3 bottom-3 w-1.5 z-10" 
                                                    style={{ backgroundImage: 'radial-gradient(circle at 100% 50%, #050505 3px, transparent 3.5px)', backgroundSize: '100% 14px' }} 
                                                />

                                                {/* Inner Border */}
                                                <div className="absolute inset-1.5 border border-black/80 rounded z-0 pointer-events-none" />

                                                {/* Ticket Content */}
                                                <div className="relative z-20 flex flex-col items-center w-full px-4">
                                                    <div className="flex gap-1 text-black text-[10px] sm:text-xs mb-1.5">
                                                        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                                                    </div>

                                                    <div className="w-full border-b-[1.5px] border-dashed border-black mb-3" />

                                                    <span
                                                        className="text-black font-black text-2xl sm:text-3xl tracking-widest drop-shadow-sm"
                                                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                                                    >
                                                        {ticket.ticket_number}
                                                    </span>

                                                    <span className="text-black/80 font-bold text-[9px] sm:text-[10px] mt-2 mb-1 tracking-wider whitespace-nowrap flex flex-col items-center gap-0.5">
                                                        <span>{formatRomanianDate(ticket.date_created)}</span>
                                                        <span className="text-black/60 text-[8px] sm:text-[9px] font-mono tracking-tight">ID: #{ticket.order_id}</span>
                                                    </span>

                                                    <div className="w-full border-t-[1.5px] border-dashed border-black mt-2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-center text-white/20 text-xs pt-2">
                                        {t('verifiedNote')}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
