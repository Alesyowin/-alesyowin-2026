"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PostalEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PostalEntryModal: React.FC<PostalEntryModalProps> = ({ isOpen, onClose }) => {
    const t = useTranslations('PostalEntry');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isMounted || !isOpen) return null;

    // Generăm secțiunile dinamic (s1 la s7)
    const sections = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];

    return createPortal(
        <div 
            className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 md:p-6"
            style={{ direction: 'ltr' }}
        >
            {/* Backdrop cu blur */}
            <div 
                className="absolute inset-0 bg-white/90 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div 
                className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-[#00A5FF]/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#00A5FF]/10 bg-gray-50">
                    <div className="space-y-1">
                        <h2 className="text-[#00A5FF] font-bold text-lg md:text-xl uppercase tracking-tighter">
                            {t('title')}
                        </h2>
                        <p className="text-black/40 text-[10px] md:text-xs uppercase tracking-widest">
                            {t('lastUpdated')}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-black/5 text-black/60 hover:text-[#00A5FF] transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    {/* Intro */}
                    <p className="text-black/80 leading-relaxed text-[15px]">
                        {t('intro')}
                    </p>

                    {/* Sections */}
                    <div className="space-y-8 pb-4">
                        {sections.map((sec) => (
                            <div key={sec} className="space-y-3">
                                <h3 className="text-[#00A5FF] font-semibold text-base py-1 px-3 border-l-2 border-[#00A5FF] bg-[#00A5FF]/5">
                                    {t(`sections.${sec}.title`)}
                                </h3>
                                <div className="text-black/70 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap pl-1">
                                    {t(`sections.${sec}.content`)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Note */}
                    <div className="pt-6 border-t border-black/5">
                        <p className="text-black/40 text-xs italic text-center">
                            {t('footerNote')}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 165, 255, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 165, 255, 0.4);
                }
            `}</style>
        </div>,
        document.body
    );
};

export default PostalEntryModal;
