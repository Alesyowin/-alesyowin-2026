import { getAllGiveaways } from '../../../lib/directus';
import EntryListClient from '../../../components/entry-list/EntryListClient';
import { getTranslations } from 'next-intl/server';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function EntryListPage({ params }: PageProps) {
    const { locale } = await params;
    const giveaways = await getAllGiveaways(locale);
    const t = await getTranslations('EntryList');

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* Fundal ambient */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D4AF37] opacity-[0.02] blur-[200px] rounded-full hidden md:block" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24">
                {/* Header */}
                <div className="mb-12">
                    <p className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]/60 mb-3">{t('subtitle')}</p>
                    <h1
                        className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {t('title')}
                    </h1>
                    <div className="h-px w-64 bg-gradient-to-r from-[#D4AF37] to-transparent mt-5" />
                    <p className="mt-4 text-white/50 text-base max-w-xl">
                        {t('description')}
                    </p>
                </div>

                {/* Grid cu filtre — componentă client pentru interactivitate */}
                <EntryListClient giveaways={giveaways} />
            </div>
        </main>
    );
}
