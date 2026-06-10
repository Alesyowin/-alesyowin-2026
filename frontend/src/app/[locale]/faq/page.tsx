import { useTranslations } from 'next-intl';

export default function FAQPage() {
    const t = useTranslations('FAQ');

    // Cheile pentru întrebări: q1 până la q6
    const questionKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];

    return (
        <div className="min-h-screen bg-(--color-black-pure) text-white font-sans py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                
                {/* Antetul Paginii */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic text-white">
                        {t('title')}
                    </h1>
                    <div className="h-1 w-24 bg-(--color-gold) mx-auto mb-6"></div>
                    <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">
                        {t('lastUpdated')}
                    </p>
                </div>

                {/* Secțiunea Introductivă */}
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 md:p-12 mb-12 shadow-2xl">
                    <p className="text-lg leading-relaxed text-gray-200 whitespace-pre-wrap italic opacity-90 text-center">
                        {t('intro')}
                    </p>
                </div>

                {/* Lista de Întrebări Frecvente */}
                <div className="space-y-8">
                    {questionKeys.map((key) => (
                        <div key={key} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 md:p-8 hover:border-(--color-gold)/30 transition-all duration-300 group">
                            <h3 className="text-xl md:text-2xl font-bold text-(--color-gold) mb-4 flex gap-4">
                                <span className="opacity-30 group-hover:opacity-100 transition-opacity">?</span>
                                {t(`sections.${key}.question`)}
                            </h3>
                            <div className="text-gray-300 leading-relaxed text-lg border-l-2 border-(--color-gold)/20 pl-6 ml-2 italic">
                                {t(`sections.${key}.answer`)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Notă de Final */}
                <div className="mt-24 pt-12 border-t border-white/10 text-center">
                    <p className="text-gray-500 text-sm italic">
                        {t('footerNote')}
                    </p>
                </div>
            </div>
        </div>
    );
}
