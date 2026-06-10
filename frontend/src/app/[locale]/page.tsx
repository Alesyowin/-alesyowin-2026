import GPCompetitionHeroV2 from '../../components/hero/GPCompetitionHeroV2';
import GiveawayCard from '../../components/home/GiveawayCard';
import { getAllGiveaways, getDirectusFileUrl } from '../../lib/directus';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic'; // Force dynamic page to bypass Next.js cache aggressively

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function Home({ params }: PageProps) {
    const { locale } = await params;
    const t = await getTranslations('Home');

    // Preluăm toate giveaway-urile active din Directus (cu traduceri pt limba curentă)
    const giveaways = await getAllGiveaways(locale);

    // Filtrăm doar cele active/published (nu cele draft)
    // Comparație case-insensitive pentru a accepta „Activ", „active", „Published" etc.
    const activeGiveaways = giveaways.filter(g => {
        const s = (g.status || '').toLowerCase();
        return s === 'active' || s === 'published' || s === 'activ';
    });

    return (
        <div className="relative">
            {/* Hero Animation Layer */}
            {/* <GPCompetitionHeroV2 /> */}

            {/* Secțiunea de Giveaway-uri Active */}
            <div id="active-competitions" className="relative z-20 bg-[#050505] py-16 md:py-24 px-4">
                <div className="max-w-7xl mx-auto">

                    {/* Titlu secțiune */}
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]/60 mb-3">
                            {t('subtitle')}
                        </p>
                        <h2
                            className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                            {t('title')}
                        </h2>
                        <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-5" />
                        <p className="mt-4 text-white/40 text-sm max-w-md mx-auto">
                            {t('description')}
                        </p>
                    </div>

                    {/* Grid cartonașe */}
                    {activeGiveaways.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {activeGiveaways.map((giveaway) => {
                                // Construim URL-ul imaginii optimizate pentru card (grid 3 coloane)
                                const fileId = giveaway.images && giveaway.images.length > 0
                                    ? (typeof giveaway.images[0].directus_files_id === 'string'
                                        ? giveaway.images[0].directus_files_id
                                        : giveaway.images[0].directus_files_id.id)
                                    : null;

                                const imageUrl = fileId
                                    ? getDirectusFileUrl(fileId, { width: 600, quality: 80 })
                                    : '/logo-principal-orizontal-fara-fundal.png';

                                return (
                                    <GiveawayCard
                                        key={giveaway.id}
                                        id={giveaway.id}
                                        title={giveaway.title}
                                        subtitle={giveaway.subtitle}
                                        price={giveaway.price_per_ticket}
                                        imageUrl={imageUrl}
                                        ticketsSold={giveaway.tickets_sold}
                                        totalTickets={giveaway.total_tickets}
                                        endDate={giveaway.end_date || ''}
                                        locale={locale}
                                        animate={true}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-white/30 text-lg">{t('noCompetitions')}</p>
                            <p className="text-white/15 text-sm mt-2">{t('checkBack')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
