import { notFound } from 'next/navigation';
import { getGiveawayBySlug, getDirectusFileUrl } from '../../../../lib/directus';
import EntryListSearch from '../../../../components/entry-list/EntryListSearch';
import { getTranslations } from 'next-intl/server';

interface PageProps {
    params: Promise<{ locale: string; slug: string }>;
}

export default async function EntryListDetailPage({ params }: PageProps) {
    const { locale, slug } = await params;
    const giveaway = await getGiveawayBySlug(slug, locale);
    const t = await getTranslations('EntryList');

    if (!giveaway) notFound();

    const imageUrl = giveaway.images && giveaway.images.length > 0
        ? getDirectusFileUrl(
            typeof giveaway.images[0].directus_files_id === 'string'
                ? giveaway.images[0].directus_files_id
                : giveaway.images[0].directus_files_id.id,
            { width: 1200, quality: 85 }
        )
        : null;

    const isSoldOut = giveaway.tickets_sold >= giveaway.total_tickets;
    // Un eveniment este "activ" vizual dacă nu s-au vândut toate biletele, 
    // chiar dacă în spate are status 'published' sau 'active'
    const displayActive = !isSoldOut;

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* Ambient */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37] opacity-[0.02] blur-[180px] rounded-full hidden md:block" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 md:py-24">

                {/* Breadcrumb */}
                <nav className="mb-8 text-xs uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                    <a href="../entry-list" className="hover:text-[#D4AF37] transition-colors">{t('title')}</a>
                    <span>›</span>
                    <span className="text-white/50">{giveaway.title}</span>
                </nav>

                {/* Event Header */}
                <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Image */}
                    <div className="w-full aspect-[16/9] rounded-sm overflow-hidden border border-[#D4AF37]/10 bg-[#111]">
                        {imageUrl ? (
                            <img src={imageUrl} alt={giveaway.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/20 text-7xl">
                                🏎️
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="space-y-4">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${displayActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/5 text-white/40 border border-white/10'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${displayActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                            {displayActive ? t('active') : t('finished')}
                        </span>

                        <h1
                            className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                            {giveaway.title}
                        </h1>

                        <div className="h-px w-32 bg-gradient-to-r from-[#D4AF37]/60 to-transparent" />

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="bg-[#0A0A0A] border border-[#D4AF37]/10 rounded-sm p-4 text-center">
                                <p className="text-[#D4AF37] font-black text-2xl">{giveaway.total_tickets.toLocaleString()}</p>
                                <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{t('totalTickets')}</p>
                            </div>
                            <div className="bg-[#0A0A0A] border border-[#D4AF37]/10 rounded-sm p-4 text-center">
                                <p className="text-[#D4AF37] font-black text-2xl">{giveaway.tickets_sold.toLocaleString()}</p>
                                <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{t('ticketsSold')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent mb-12" />

                {/* Search Section */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h2
                            className="text-xl md:text-2xl font-black text-white uppercase tracking-widest"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                            🔍 {t('searchTitle')}
                        </h2>
                        <p className="text-white/40 text-sm mt-2">
                            {t('searchDescription')}
                        </p>
                    </div>

                    <EntryListSearch giveawayId={giveaway.id} />
                </div>
            </div>
        </main>
    );
}
