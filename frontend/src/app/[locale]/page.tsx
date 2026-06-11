import GiveawayCard from '../../components/home/GiveawayCard';
import HeroAnimatedText from '../../components/hero/HeroAnimatedText';
import { getAllGiveaways, getDirectusFileUrl } from '../../lib/directus';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function Home({ params }: PageProps) {
    const { locale } = await params;
    const t = await getTranslations('Home');

    const giveaways = await getAllGiveaways(locale);

    const activeGiveaways = giveaways.filter(g => {
        const s = (g.status || '').toLowerCase();
        return s === 'active' || s === 'published' || s === 'activ';
    });

    return (
        <div className="relative bg-[#000000]">
            {/* Alesywin Hero Banner */}
            <div className="relative w-full h-screen min-h-[600px] bg-black">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
                    style={{ backgroundImage: "url('/hero%201.webp')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#f8f9fa]" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center pb-20">
                    <HeroAnimatedText />
                </div>
            </div>

            {/* Secțiunea de Giveaway-uri Active */}
            <div id="active-competitions" className="relative z-20 py-16 md:py-24 px-4 max-w-7xl mx-auto">
                {/* Titlu secțiune */}
                <div className="text-center mb-12">
                    <h2
                        className="text-3xl md:text-5xl font-black text-[#00A5FF] uppercase tracking-tight"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {t('title')}
                    </h2>
                    <div className="h-1 w-24 bg-[#00A5FF] mx-auto mt-4 rounded-full" />
                    <p className="mt-4 text-gray-200 text-sm max-w-md mx-auto font-medium">
                        {t('description')}
                    </p>
                </div>

                {/* Grid cartonașe */}
                {activeGiveaways.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activeGiveaways.map((giveaway) => {
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
                    <div className="text-center py-16 bg-[#111] rounded-xl shadow-sm border border-[#222]">
                        <p className="text-gray-200 text-lg font-semibold">{t('noCompetitions')}</p>
                        <p className="text-gray-400 text-sm mt-2">{t('checkBack')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
