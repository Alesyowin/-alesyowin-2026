import { notFound } from 'next/navigation';
import { getAllGiveaways, getDirectusFileUrl } from '../../../../lib/directus';
import CategoryGiveawayCard from '../../../../components/category/CategoryGiveawayCard';
import { getTranslations } from 'next-intl/server';

interface PageProps {
    params: Promise<{ locale: string; slug: string }>;
}

const VALID_CATEGORIES = ['cars', 'apartments', 'cash', 'tech'];

export default async function CategoryPage({ params }: PageProps) {
    const { locale, slug } = await params;
    const t = await getTranslations('Category');

    // Verificăm dacă e o categorie validă
    if (!VALID_CATEGORIES.includes(slug)) {
        notFound();
    }

    // Traducere titlurilor paginilor din sistemul i18n
    const categoryTitles: Record<string, string> = {
        cars: t('cars'),
        apartments: t('apartments'),
        cash: t('cashPrizes'),
        tech: t('techGadgets'),
    };
    const pageTitle = categoryTitles[slug] || slug.toUpperCase();

    // Preluăm toate giveaway-urile (cu traduceri pt limba curentă)
    const giveaways = await getAllGiveaways(locale);

    // Filtrăm: active/published + clasa categoriei curente
    // În Directus câmpul este „category"
    const categoryGiveaways = giveaways.filter(g => {
        // Status valid
        const status = (g.status || '').toLowerCase();
        const isActive = status === 'active' || status === 'published' || status === 'activ';
        
        // Categorie potrivită (ignorăm case)
        const itemCategory = (g.category || '').toLowerCase();
        const matchesCategory = itemCategory === slug.toLowerCase();

        return isActive && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 border-b border-[#D4AF37]/20 pb-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/60 mb-2">
                        GP Competition &rsaquo; {t('breadcrumb')}
                    </p>
                    <h1
                        className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {pageTitle}
                    </h1>
                </div>

                {categoryGiveaways.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categoryGiveaways.map((giveaway) => {
                            const fileId = giveaway.images && giveaway.images.length > 0
                                ? (typeof giveaway.images[0].directus_files_id === 'string'
                                    ? giveaway.images[0].directus_files_id
                                    : giveaway.images[0].directus_files_id.id)
                                : null;

                            const imageUrl = fileId
                                ? getDirectusFileUrl(fileId, { width: 600, quality: 80 })
                                : '/logo-principal-orizontal-fara-fundal.png';

                            return (
                                <CategoryGiveawayCard
                                    key={giveaway.id}
                                    id={giveaway.id}
                                    title={giveaway.title}
                                    subtitle={giveaway.subtitle}
                                    price={giveaway.price_per_ticket}
                                    imageUrl={imageUrl}
                                    locale={locale}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-[#0A0A0A] border border-[#D4AF37]/10 rounded-lg p-12 text-center">
                        <span className="text-4xl block mb-4">🏆</span>
                        <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            {t('noActive', { category: pageTitle.toLowerCase() })}
                        </h2>
                        <p className="text-white/40 text-sm">
                            {t('preparingNew')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
