import { notFound } from 'next/navigation';
import { getGiveawayBySlug, getDirectusFileUrl, MOCK_GIVEAWAY } from '../../../../lib/directus';
import CountdownTimer from '../../../../components/giveaway/CountdownTimer';
import ProgressBar from '../../../../components/giveaway/ProgressBar';
import QuizGate from '../../../../components/giveaway/QuizGate';
import ImageGallery from '../../../../components/giveaway/ImageGallery';
import GiveawayInformation from '../../../../components/giveaway/GiveawayInformation';
import { GiveawayLiveProvider } from '../../../../components/giveaway/GiveawayLiveProvider';
import { getTranslations } from 'next-intl/server';

interface PageProps {
    params: Promise<{ locale: string; slug: string }>;
}

import PostalEntryTrigger from '../../../../components/giveaway/PostalEntryTrigger';

// Pictogramă pentru categoria produsului
function CategoryBadge({ category, labels }: { category?: string; labels: Record<string, string> }) {
    const config: Record<string, { icon: string; key: string }> = {
        cars: { icon: '', key: 'cars' },
        apartments: { icon: '', key: 'apartments' },
        cash: { icon: '', key: 'cash' },
        tech: { icon: '', key: 'tech' },
    };
    const item = category && config[category] ? config[category] : null;
    if (!item) return null;
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00A5FF]/10 border border-[#00A5FF]/20 rounded-full text-xs text-[#00A5FF] font-semibold uppercase tracking-widest">
            {item.icon} {labels[item.key] || item.key}
        </span>
    );
}

export default async function GiveawayPage({ params }: PageProps) {
    const { locale, slug } = await params;
    const t = await getTranslations('GiveawayPage');

    // Preluare date din Directus cu fallback la mock (cu traduceri pt limba curentă)
    let giveaway = await getGiveawayBySlug(slug, locale);

    if (!giveaway) {
        notFound();
    }

    // Construire lista de ID-uri de imagini (pentru ImageGallery optimizat)
    const imageIds: string[] = (giveaway.images ?? []).map((img) => {
        if (typeof img.directus_files_id === 'string') {
            return img.directus_files_id;
        }
        return img.directus_files_id.id;
    });

    // Imaginea reprezentativă pentru coș (optimizată la 200px)
    const mainImageId = imageIds[0];
    const cartImageUrl = mainImageId 
        ? getDirectusFileUrl(mainImageId, { width: 200, quality: 70 })
        : '/logo-principal-orizontal-fara-fundal.png';

    // Dacă nu există imagini deloc (caz improbabil)
    if (imageIds.length === 0) {
        // Păstrăm un array gol sau cu un fallback
    }

    const answers: [string, string, string] = [
        giveaway.quiz_answer_1,
        giveaway.quiz_answer_2,
        giveaway.quiz_answer_3,
    ];

    // Verificăm dacă există premii instant configurate
    const hasInstantPrizes = Array.isArray(giveaway.instant_prizes) && giveaway.instant_prizes.length > 0;

    // Etichetele categoriilor traduse
    const categoryLabels: Record<string, string> = {
        cars: t('cars'),
        apartments: t('apartments'),
        cash: t('cash'),
        tech: t('tech'),
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <GiveawayLiveProvider 
                giveawayId={giveaway.id} 
                initialPrizes={giveaway.instant_prizes || []}
                initialBonusDraws={giveaway.bonus_draws || []}
                initialTicketsSold={giveaway.tickets_sold}
            >
            {/* Fundal ambient */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00A5FF] opacity-[0.025] blur-[150px] rounded-full hidden md:block" />
            </div>

            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

                {/* ---- HEADER BREADCRUMB ---- */}
                <div className="mb-6 flex items-center gap-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#00A5FF]/60">
                        ALESYOWIN &rsaquo; {locale.toUpperCase()}
                    </p>
                    {/* Badge categorie din schema reală */}
                    <CategoryBadge category={giveaway.category} labels={categoryLabels} />
                </div>

                {/* ---- LAYOUT 2 COLOANE ---- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* STÂNGA: Galerie + Descriere */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Galeria interactivă */}
                        <ImageGallery images={imageIds} title={giveaway.title} />
                    </div>

                    {/* DREAPTA: Titlu + Preț + Timer + Progres + Quiz */}
                    <div className="lg:col-span-5 space-y-8">

                        {/* Detalii Principale aliniate vertical */}
                        <div className="space-y-4">
                            <h1
                                className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] uppercase tracking-tight"
                                style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                                {giveaway.title}
                            </h1>
                            {/* Subtitlu */}
                            {giveaway.subtitle && (
                                <p className="text-[#00A5FF]/70 text-lg font-light tracking-wide">
                                    {giveaway.subtitle}
                                </p>
                            )}

                            {/* Prețul biletului */}
                            <div className="flex items-end gap-3 pt-2">
                                <span
                                    className="text-4xl md:text-5xl font-black text-[#00A5FF]"
                                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                                >
                                    £{Number(giveaway.price_per_ticket).toFixed(2)}
                                </span>
                                <span className="text-white/40 text-base mb-1">{t('perTicket')}</span>
                            </div>
                        </div>

                        {/* Limita per utilizator — câmp nou din schema */}
                        {giveaway.limit_per_user && giveaway.limit_per_user > 0 && (
                            <p className="text-xs text-white/40 -mt-4 uppercase tracking-widest">
                                {t('maxTickets', { limit: giveaway.limit_per_user })}
                            </p>
                        )}

                        {/* Timer Countdown */}
                        <div className="space-y-3">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-white/40">{t('timeRemaining')}</h3>
                            <CountdownTimer endDate={giveaway.end_date} isSoldOut={giveaway.tickets_sold >= giveaway.total_tickets} />
                        </div>

                        {/* Secțiune Live Draw & Detalii Concurs */}
                        <div className="space-y-4 pt-1">
                            {/* Badge */}
                            <div>
                                <span className="inline-block bg-[#00A5FF] text-white text-sm font-bold px-5 py-1.5 rounded-full shadow-md">
                                    {t('liveDrawBadge')}
                                </span>
                            </div>

                            {/* Info List */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2.5 text-white/90 text-sm md:text-[15px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/40 shrink-0">
                                        <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM13.75 5.5l3.868-1.547A1.25 1.25 0 0119.5 5.122v9.756a1.25 1.25 0 01-1.882 1.169l-3.868-1.547V5.5z" />
                                    </svg>
                                    <p className="[&_a]:font-semibold [&_a]:text-[#00A5FF] [&_a]:hover:underline">
                                        {t.rich('liveDrawInfo', {
                                            fb: (chunks) => <a href="https://www.facebook.com/profile.php?id=61574236922040" target="_blank" rel="noopener noreferrer">{chunks}</a>,
                                            yt: (chunks) => <a href="https://www.youtube.com/@GpCompetition-uk" target="_blank" rel="noopener noreferrer">{chunks}</a>
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5 text-white/90 text-sm md:text-[15px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/40 shrink-0">
                                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                    <p className="[&_strong]:font-semibold [&_strong]:text-white">
                                        {t.rich('winnersInfo', {
                                            strong: (chunks) => <strong>{chunks}</strong>
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5 text-white/90 text-sm md:text-[15px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/40 shrink-0">
                                        <path fillRule="evenodd" d="M1.5 7.125c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.375c0 .621-.504 1.125-1.125 1.125a1.125 1.125 0 000 2.25c.621 0 1.125.504 1.125 1.125v3.375c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 17.25v-3.375c0-.621.504-1.125 1.125-1.125a1.125 1.125 0 000-2.25c-.621 0-1.125-.504-1.125-1.125V7.125zm14.25 2.062a.75.75 0 00-1.5 0v5.625a.75.75 0 001.5 0V9.188zM12 9.188a.75.75 0 00-1.5 0v5.625a.75.75 0 001.5 0V9.188z" clipRule="evenodd" />
                                    </svg>
                                    <p className="[&_strong]:font-semibold [&_strong]:text-white">
                                        {t.rich('entriesInfo', {
                                            count: Number(giveaway.total_tickets).toLocaleString(locale),
                                            strong: (chunks) => <strong>{chunks}</strong>
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Postal Entry Trigger (Client Component) */}
                            <div className="pt-2">
                                <PostalEntryTrigger label={t('postalEntryBtn')} />
                            </div>
                        </div>

                        {/* Bara de Progres */}
                        <div className="space-y-3">
                            <h3 className="text-xs uppercase tracking-[0.25em] text-white/40">{t('ticketsSold')}</h3>
                            <ProgressBar
                                ticketsSold={giveaway.tickets_sold}
                                totalTickets={giveaway.total_tickets}
                            />
                            {/* Afișăm și tickets_left dacă există în DB */}
                            {giveaway.tickets_left !== undefined && (
                                <p className="text-xs text-white/40 text-right">
                                    {t('ticketsRemaining', { count: Number(giveaway.tickets_left).toLocaleString(locale) })}
                                </p>
                            )}
                        </div>

                        {/* Separator */}
                        <div className="h-px w-full bg-[#00A5FF]/20" />

                        {/* Secțiunea Quiz */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs uppercase tracking-[0.25em] text-[#00A5FF] mb-1">
                                    {t('quizTitle')}
                                </h3>
                                <p className="text-white/40 text-xs">
                                    {t('quizSubtitle')}
                                </p>
                            </div>

                            <QuizGate
                                giveawayId={giveaway.id}
                                giveawayTitle={giveaway.title}
                                giveawayImage={cartImageUrl}
                                question={giveaway.quiz_question}
                                answers={answers}
                                correctIndex={giveaway.correct_answer_index}
                                price={giveaway.price_per_ticket}
                                currencySymbol="£"
                                isFree={giveaway.price_per_ticket === 0}
                                minTickets={giveaway.min_tickets}
                            />
                        </div>

                    </div>
                </div>

            </div>

            {/* Secțiuni Informații Produs (Tabs) - Aliniat cu lățimea maximă a paginii (max-w-[1600px]) */}
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <GiveawayInformation 
                    description={giveaway.description}
                    competitionDetails={giveaway.competition_details}
                    instantPrizes={giveaway.instant_prizes}
                    bonusDraw={giveaway.bonus_draw}
                    giveawayId={giveaway.id}
                    price={giveaway.price_per_ticket}
                    enableLeaderboard={giveaway.enable_leaderboard}
                />
            </div>
            </GiveawayLiveProvider>
        </main>
    );
}
