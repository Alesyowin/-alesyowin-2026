import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('Privacy');

  // Section keys to iterate over (s1 through s12)
  const sectionKeys = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];

  return (
    <div className="min-h-screen bg-(--color-black-pure) text-white font-sans py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic text-white">
            {t('title')}
          </h1>
          <div className="h-1 w-24 bg-(--color-gold) mx-auto mb-6"></div>
          <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">
            {t('lastUpdated')}
          </p>
        </div>

        {/* Intro Section */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-8 md:p-12 mb-12 shadow-2xl">
          <p className="text-lg leading-relaxed text-gray-200 whitespace-pre-wrap italic opacity-90">
            {t('intro')}
          </p>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-12">
          {sectionKeys.map((key) => (
            <section key={key} className="relative group">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-(--color-gold) opacity-30 group-hover:opacity-100 transition-opacity rounded-full hidden md:block"></div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-(--color-gold) uppercase tracking-wide mb-6">
                {t(`sections.${key}.title`)}
              </h2>
              
              <div className="text-gray-300 leading-relaxed text-lg space-y-4 whitespace-pre-wrap bg-white/2 p-6 md:p-0 rounded-xl">
                {t(`sections.${key}.content`)}
              </div>
            </section>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-24 pt-12 border-t border-white/10 text-center">
          <p className="text-gray-500 text-sm italic">
            {t('footerNote')} <span className="text-(--color-gold)">info@gpcompetition.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
