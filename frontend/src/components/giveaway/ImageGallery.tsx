"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getDirectusFileUrl } from '../../lib/directus';
import { motion, AnimatePresence } from 'framer-motion';

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0
    })
};

interface ImageGalleryProps {
    images: string[];
    title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Setăm mounted-ul pentru a permite portalul doar pe client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sincronizare scroll miniaturi în Lightbox pe mobil
    useEffect(() => {
        if (isLightboxOpen) {
            const activeThumb = document.querySelector('.lb-footer-thumb.active');
            if (activeThumb) {
                activeThumb.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [activeIndex, isLightboxOpen]);

    // Stări pentru swipe (folosim useRef pentru a evita sacadarea și re-render-urile pe mobil)
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const minSwipeDistance = 50;

    // SECRETUL VITEZEI: Folosim EXACT același URL (fără parametri de transformare) atât pentru imaginea principală,
    // cât și pentru Lightbox! Astfel:
    // 1. Directus livrează fișierul original, la 0% CPU (nu mai folosește 'sharp').
    // 2. Browserul memorează fișierul (700KB) în momentul în care afișează imaginea principală.
    // 3. Când dăm click pntru Lightbox, browser-ul observă că cere fix ACELAȘI URL, așa că îl preia din memoria RAM internă instantaneu (0 secunde).
    const mainImageUrl = getDirectusFileUrl(images[activeIndex]);
    const lightboxImageUrl = getDirectusFileUrl(images[activeIndex]);

    // PRE-LOAD ELEGANT: Pentru a ne asigura că și "schimbarea pozei în Lightbox/Galerie" e instantanee (0 secunde de descărcare),
    // pre-încărcăm liniștit următoarea și precedenta imagine, pe rând, fără a inunda serverul.
    const [preloaded, setPreloaded] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (typeof window === 'undefined' || images.length === 0) return;

        // Calculăm ce imagini urmează (Next și Prev)
        const nextIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
        const prevIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;

        const indexesToPreload = [activeIndex, nextIndex, prevIndex];
        
        indexesToPreload.forEach(idx => {
            if (!preloaded.has(idx)) {
                const img = new window.Image();
                img.src = getDirectusFileUrl(images[idx]);
                setPreloaded(prev => new Set(prev).add(idx));
            }
        });
    }, [activeIndex, images, preloaded]);

    const handleNext = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDirection(1);
        setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handlePrev = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDirection(-1);
        setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleThumbnailClick = (newIndex: number) => {
        if (newIndex === activeIndex) return;
        setDirection(newIndex > activeIndex ? 1 : -1);
        setActiveIndex(newIndex);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null;
        touchStartX.current = e.touches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }

        // Resetăm stările pentru următorul gest
        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Metodă pentru a randa Modalul prin Portal (evităm definirea ca sub-componentă pentru a nu se distruge la re-render)
    const renderLightbox = () => {
        if (!isLightboxOpen || !isMounted) return null;

        return createPortal(
                <div 
                    className="lb-root" 
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.95)',
                        zIndex: 2147483647,
                        display: 'flex', flexDirection: 'column',
                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                        touchAction: 'none', overflow: 'hidden', direction: 'ltr'
                    }}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                {/* CSS V10 BLACK-GOLD - Mobil exclusiv */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 768px) {
                        .lb-root { background-color: #000000 !important; backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important; }
                        
                        .lb-header { height: 60px !important; padding: 10px 20px !important; border-bottom: 1px solid #1a1a1a !important; background: rgba(0,0,0,0.4) !important; }
                        .lb-close-btn { 
                            all: unset !important; 
                            width: 44px !important; height: 44px !important;
                            background: transparent !important; 
                            color: #00A5FF !important;
                            display: flex !important; align-items: center !important; justify-content: center !important;
                            cursor: pointer !important;
                        }
                        .lb-close-btn svg { width: 32px !important; height: 32px !important; stroke-width: 2 !important; }
                        
                        .lb-nav-col { display: none !important; }
                        
                        .lb-image-container { 
                            padding: 0 !important; 
                            display: flex !important; flex-direction: column !important;
                            justify-content: center !important;
                            flex-grow: 1 !important;
                        }
                        .lb-image { 
                            max-height: 65vh !important; 
                            width: 100vw !important;
                            object-fit: contain !important;
                            box-shadow: 0 0 50px rgba(0,0,0,0.5) !important; 
                        }
                        
                        .lb-counter {
                            display: block !important;
                            text-align: center !important;
                            color: #00A5FF !important; font-size: 14px !important; padding: 15px 0 !important;
                            font-weight: 600 !important; letter-spacing: 1px !important;
                        }
                        
                        .lb-footer-thumbs {
                            display: flex !important; gap: 8px !important;
                            overflow-x: auto !important; padding: 12px 15px !important;
                            background: #000000 !important;
                            border-top: 1px solid #1a1a1a !important;
                            scrollbar-width: none !important;
                        }
                        .lb-footer-thumbs::-webkit-scrollbar { display: none !important; }
                        .lb-footer-thumb {
                            flex-shrink: 0 !important; width: 60px !important; height: 60px !important;
                            border-radius: 4px !important; overflow: hidden !important; 
                            border: 2px solid transparent !important; transition: all 0.2s !important;
                            opacity: 0.5 !important;
                        }
                        .lb-footer-thumb.active { border-color: #00A5FF !important; border-width: 2px !important; opacity: 1 !important; }
                        .lb-footer-thumb img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
                        
                        .lb-footer-spacing { display: none !important; }
                    }
                `}} />

                {/* 1. BARA DE SUS (CLOSE CONTROL) */}
                <div className="lb-header" style={{ position: 'relative', width: '100%', height: '80px', display: 'flex', justifyContent: 'flex-end', padding: '20px 30px', zIndex: 10 }}>
                    <button
                        className="lb-close-btn"
                        onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                        style={{
                            all: 'unset', width: '56px', height: '56px', borderRadius: '50%',
                            backgroundColor: '#111', color: '#00A5FF', border: '2px solid #00A5FF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    {/* Fundalul modalului care permite închiderea cu un clic oriunde pe fundal */}
                    <div
                        style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, cursor: 'zoom-out' }}
                        onClick={() => setIsLightboxOpen(false)}
                    />
                </div>

                {/* 2. ZONA CENTRALĂ (PREV | IMAGINE | NEXT) */}
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', position: 'relative' }}>

                    {/* Săgeată STÂNGA - Ascunsă pe mobil */}
                    <div className="lb-nav-col" style={{ width: '80px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                        {images.length > 1 && (
                            <button
                                className="lb-nav-btn"
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                style={{
                                    all: 'unset', width: '64px', height: '64px', borderRadius: '50%',
                                    backgroundColor: '#111', color: '#00A5FF', border: '2px solid #00A5FF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
                                }}
                            >
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                        )}
                    </div>

                    {/* Imaginea Centrală + Counter pe mobil */}
                    <div 
                        className="lb-image-container" 
                        style={{ flexGrow: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}
                    >
                        <img
                            className="lb-image"
                            src={lightboxImageUrl}
                            alt={title}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '85vh',
                                objectFit: 'contain',
                                userSelect: 'none',
                                boxShadow: '0 0 60px rgba(0,0,0,1)'
                            }}
                            onDoubleClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {/* Indicator numeric doar pentru mobil */}
                        <div className="lb-counter" style={{ display: 'none' }}>
                            {activeIndex + 1} / {images.length}
                        </div>
                    </div>

                    {/* Săgeată DREAPTA - Ascunsă pe mobil */}
                    <div className="lb-nav-col" style={{ width: '80px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                        {images.length > 1 && (
                            <button
                                className="lb-nav-btn"
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                style={{
                                    all: 'unset', width: '64px', height: '64px', borderRadius: '50%',
                                    backgroundColor: '#111', color: '#00A5FF', border: '2px solid #00A5FF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
                                }}
                            >
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="lb-footer-thumbs" style={{ display: 'none' }}>
                    {images.map((fileId, i) => (
                        <div
                            key={i}
                            className={`lb-footer-thumb ${i === activeIndex ? 'active' : ''}`}
                            onClick={() => setActiveIndex(i)}
                        >
                            <img src={getDirectusFileUrl(fileId, { width: 200, quality: 70 })} alt="Thumb" />
                        </div>
                    ))}
                </div>

                {/* 4. SPAȚIERE BAZĂ (Desktop) */}
                <div className="lb-footer-spacing" style={{ width: '100%', height: '60px' }} />
            </div>,
            document.body
        );
    };

    return (
    <div className="space-y-4">
        <div
            className="w-full aspect-[4/3] rounded-sm overflow-hidden border border-[#00A5FF]/10 bg-[#0a0a0a] relative group select-none"
            onDoubleClick={() => setIsLightboxOpen(true)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <AnimatePresence initial={false} custom={direction}>
                <motion.img
                    key={activeIndex}
                    src={mainImageUrl}
                    alt={title}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ x: { type: "tween", duration: 0.3, ease: "easeInOut" }, opacity: { duration: 0.2 } }}
                    className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                />
            </AnimatePresence>

            {images.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-3 z-[40] pointer-events-none">
                    <button 
                        onClick={handlePrev} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/80 text-white border border-white/10 hover:bg-[#00A5FF] hover:border-[#00A5FF] transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 touch-manipulation pointer-events-auto shadow-lg"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button 
                        onClick={handleNext} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/80 text-white border border-white/10 hover:bg-[#00A5FF] hover:border-[#00A5FF] transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 touch-manipulation pointer-events-auto shadow-lg"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            )}
        </div>

        {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((fileId, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleThumbnailClick(i)} 
                        className={`shrink-0 w-20 h-20 rounded-sm overflow-hidden bg-gray-100 border-2 transition-all duration-200 ${i === activeIndex ? 'border-[#00A5FF] shadow-[0_0_10px_rgba(0,165,255,0.3)]' : 'border-[#00A5FF]/20 hover:border-[#00A5FF]/60'}`}
                    >
                        <img src={getDirectusFileUrl(fileId, { width: 200, quality: 70 })} alt={`${title} - ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        )}

        {renderLightbox()}
    </div>
);
}
