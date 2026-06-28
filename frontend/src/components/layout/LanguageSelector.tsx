"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '../../i18n/routing';
import { useState, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { GB, RO, DE, FR, IT, ES, BG, TR } from 'country-flag-icons/react/3x2';

const languages = [
    { code: 'en', label: 'EN', Component: GB },
    { code: 'ro', label: 'RO', Component: RO },
    { code: 'de', label: 'DE', Component: DE },
    { code: 'fr', label: 'FR', Component: FR },
    { code: 'it', label: 'IT', Component: IT },
    { code: 'es', label: 'ES', Component: ES },
    { code: 'bg', label: 'BG', Component: BG },
    { code: 'tr', label: 'TR', Component: TR },
];

export default function LanguageSelector() {
    const [isPending, startTransition] = useTransition();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Închidem meniul când dăm click în afara lui
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleLocaleChange(nextLocale: string) {
        setIsOpen(false);
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale, scroll: false });
        });
    }

    const currentLang = languages.find(l => l.code === locale) || languages[0];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Triggerul selectorului */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded bg-(--color-black-soft) border border-(--color-gold)/30 
                    hover:border-(--color-gold)/60 transition-all duration-300 outline-none
                    ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <div className="relative w-6 h-4 overflow-hidden border border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                    <currentLang.Component className="w-full h-full object-cover" />
                </div>
                <ChevronDown size={14} className={`text-(--color-gold) transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Meniul Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 5 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full z-[100] min-w-[120px] bg-(--color-black-rich) border border-(--color-gold)/20 rounded-md shadow-2xl py-1 overflow-hidden"
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLocaleChange(lang.code)}
                                className={`
                                    flex items-center gap-3 w-full px-4 py-2 text-left text-sm font-semibold transition-colors
                                    ${locale === lang.code ? 'bg-(--color-gold)/10 text-(--color-gold)' : 'text-gray-400 hover:bg-(--color-black-soft) hover:text-white'}
                                `}
                            >
                                <div className={`
                                    relative w-6 h-4 overflow-hidden border border-white/20 
                                    ${locale === lang.code ? 'shadow-[0_0_12px_rgba(255,255,255,0.8)] scale-110' : ''}
                                    transition-all duration-300
                                `}>
                                    <lang.Component className="w-full h-full object-cover" />
                                </div>
                                <span className="uppercase tracking-wider">{lang.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
