"use client";

import React, { useEffect, useState } from 'react';

const ALESYOWINHeroV2 = () => {
    const [mounted, setMounted] = useState(false);
    const [animationState, setAnimationState] = useState('idle'); // idle -> tire-tracks -> assemble -> impact -> floating

    useEffect(() => {
        setMounted(true);
        // Sequence timing - V1 fast speeds
        const tracksTimer = setTimeout(() => setAnimationState('tire-tracks'), 100);
        const assembleTimer = setTimeout(() => setAnimationState('assemble'), 100);
        const impactTimer = setTimeout(() => setAnimationState('impact'), 1800);
        const floatingTimer = setTimeout(() => setAnimationState('floating'), 2500);

        return () => {
            clearTimeout(tracksTimer);
            clearTimeout(assembleTimer);
            clearTimeout(impactTimer);
            clearTimeout(floatingTimer);
        };
    }, []);

    const handleScrollToProducts = () => {
        const element = document.getElementById('active-competitions');
        if (element) {
            const top = element.getBoundingClientRect().top + window.scrollY - 80; // offset pentru navbar
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    // Fragments coming from extreme corners for V2
    const fragments = [
        { id: 1, clip: 'polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)', x: -120, y: -120, r: 180, d: 0.1 }, // Top Left
        { id: 2, clip: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)', x: 120, y: -120, r: -180, d: 0.3 }, // Top Right
        { id: 3, clip: 'polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)', x: -120, y: 120, r: 180, d: 0.05 }, // Bottom Left
        { id: 4, clip: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)', x: 120, y: 120, r: -180, d: 0.4 }, // Bottom Right
        { id: 5, clip: 'polygon(25% 25%, 75% 25%, 75% 75%, 25% 75%)', x: 0, y: -150, r: 360, d: 0.2 }, // Top Center
        { id: 6, clip: 'polygon(10% 10%, 40% 10%, 40% 40%, 10% 40%)', x: -150, y: 0, r: -360, d: 0.5 }, // Left Center
        { id: 7, clip: 'polygon(60% 60%, 90% 60%, 90% 90%, 60% 90%)', x: 150, y: 0, r: 360, d: 0.15 }, // Right Center
        { id: 8, clip: 'polygon(40% 0%, 60% 0%, 60% 100%, 40% 100%)', x: 0, y: 150, r: -360, d: 0.35 }, // Bottom Center
    ];

    if (!mounted) return <div className="min-h-screen bg-black" />;

    const isAssemblingOrLater = ['assemble', 'impact', 'floating'].includes(animationState);
    const isImpactOrLater = ['impact', 'floating'].includes(animationState);
    const isFloating = animationState === 'floating';

    return (
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#050505] overflow-hidden select-none py-12 px-4">
            {/* Background Radial Gradient */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: 'radial-gradient(circle at center, #1a1508 0%, #000000 80%)',
                    opacity: animationState === 'idle' ? 0 : 1,
                    transition: 'opacity 1.5s ease-in'
                }}
            />

            {/* Tire Tracks & Speed Lines Animation */}
            {['tire-tracks', 'assemble', 'impact'].includes(animationState) && (
                <div className="absolute inset-0 z-0 overflow-hidden opacity-40 pointer-events-none">
                    {/* Left/Bottom Track */}
                    <div className="absolute top-1/2 left-0 w-[200%] h-16 origin-left -translate-y-[150px] rotate-12">
                        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMTBoMjB2MjBIMHoiIGZpbGw9IiMxYTFhMWEiLz48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6IiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+')] animate-tire-burn" />
                    </div>
                    {/* Right/Top Track */}
                    <div className="absolute top-1/2 right-0 w-[200%] h-16 origin-right translate-y-[100px] -rotate-[15deg]">
                        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMTBoMjB2MjBIMHoiIGZpbGw9IiMxYTFhMWEiLz48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6IiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+')] animate-tire-burn-reverse" />
                    </div>

                    {/* Horizontal Speed Lines */}
                    {[...Array(25)].map((_, i) => (
                        <div
                            key={`speed-${i}`}
                            className="absolute h-[2px] bg-gradient-to-r from-transparent via-[#f0d060] to-transparent animate-speed-line opacity-70"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                width: `${Math.random() * 300 + 100}px`,
                                animationDelay: `${Math.random() * 1.5}s`,
                                animationDuration: `${Math.random() * 0.3 + 0.2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Animation Container - Logo MUCH Larger (max-w-[1000px]) */}
            <div className="relative z-10 w-full max-w-[1000px] aspect-[21/9] flex items-center justify-center mt-4 md:mt-12">

                {/* Fragmented Assembly Layers - Gathering from ALL Corners */}
                {isAssemblingOrLater && !isImpactOrLater && fragments.map((f) => (
                    <div
                        key={f.id}
                        className="absolute inset-0 transition-all"
                        style={{
                            clipPath: f.clip,
                            transform: `translate(${f.x}vw, ${f.y}vh) rotate(${f.r}deg) scale(0.1)`,
                            opacity: 0,
                            // Fast 1.5s assembly
                            animation: `assemble-piece-v2 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards`,
                            animationDelay: `${f.d}s`
                        }}
                    >
                        <img
                            src="/logo-principal-orizontal-fara-fundal.png"
                            alt="fragment"
                            className="w-full h-full object-contain brightness-[2.5] contrast-150 drop-shadow-[0_0_20px_rgba(240,208,96,0.8)]"
                        />
                    </div>
                ))}

                {/* Impact Visuals (Explosion & Flames) */}
                {isImpactOrLater && !isFloating && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        {/* Impact Flash */}
                        <div className="absolute w-full h-full bg-white animate-flash opacity-0 mix-blend-overlay rounded-full blur-3xl" />
                        {/* Massive Shockwave */}
                        <div className="absolute w-20 h-20 border-4 border-[#f0d060] rounded-full animate-shockwave opacity-0" />

                        {/* Directional Sparks */}
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={`spark-${i}`}
                                className="absolute w-1.5 h-16 bg-gradient-to-t from-transparent via-[#f0d060] to-white rounded-full animate-aggressive-spark"
                                style={{
                                    transform: `rotate(${i * 12}deg) translateY(-120px)`,
                                    animationDelay: `${Math.random() * 0.15}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Final Integrated Logo */}
                <div
                    className={`relative w-full h-full transition-all duration-[800ms] ${isImpactOrLater ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-125 rotate-3'
                        } ${isFloating ? 'animate-float-v2' : ''}`}
                    style={{
                        filter: isFloating ? 'drop-shadow(0 15px 35px rgba(240, 208, 96, 0.45))' : 'none'
                    }}
                >
                    <img
                        src="/logo-principal-orizontal-fara-fundal.png"
                        alt="ALESYOWIN Large Logo"
                        className="w-full h-full object-contain"
                    />
                    {/* Fiery Glow Overlay */}
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0d060]/40 to-transparent animate-shimmer-fast pointer-events-none mix-blend-color-dodge"
                    />
                </div>
            </div>

            {/* Typography Overlay - Clearer Font (Montserrat) */}
            <div
                className={`mt-8 md:mt-12 text-center transition-all duration-1000 flex flex-col items-center z-20 relative ${isFloating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
            >
                <h2
                    className="text-3xl md:text-7xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-br from-white via-[#fbd868] to-[#9c791d] uppercase mb-2 drop-shadow-2xl px-2"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                    ALESYOWIN
                </h2>
                <div className="h-1 w-48 md:w-64 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mb-4 opacity-80" />
                <h3
                    className="text-lg md:text-3xl font-semibold tracking-[0.4em] text-white/90 uppercase mb-8"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                    LUXURY GIVEAWAY
                </h3>

                {/* Control Actions - Specifically positioned below the text */}
                <div className={`transition-opacity duration-700 ${isFloating ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={handleScrollToProducts}
                        className="px-6 py-2 md:px-8 md:py-3 bg-gradient-to-r from-[#8b6914] via-[#D4AF37] to-[#f0d060] btn-gold-safe text-black text-xs md:text-sm tracking-[0.2em] uppercase font-bold hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-300 rounded-sm hover:scale-105 btn-gold-safe"
                        style={{ 
                            backgroundColor: '#D4AF37',
                            opacity: 1,
                            visibility: 'visible',
                            zIndex: 999,
                            position: 'relative',
                            display: 'inline-block'
                        }}
                    >
                        Find out more
                    </button>
                </div>
            </div>

            {/* Global CSS for V2 animations */}
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;900&display=swap');

        @keyframes assemble-piece-v2 {
          0% {
            opacity: 0;
            transform: translate(var(--start-x, -100vw), var(--start-y, -100vh)) rotate(var(--start-r, 180deg)) scale(0.1);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
        }

        @keyframes tire-burn {
          0% { transform: scaleX(0) translateX(-30%); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: scaleX(1.5) translateX(30%); opacity: 0; }
        }

        @keyframes tire-burn-reverse {
          0% { transform: scaleX(0) translateX(30%); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: scaleX(1.5) translateX(-30%); opacity: 0; }
        }

        @keyframes speed-line {
          0% { transform: translateX(100vw); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(-100vw); opacity: 0; }
        }

        @keyframes shockwave {
          0% { transform: scale(0.05); opacity: 1; border-width: 15px; }
          100% { transform: scale(6); opacity: 0; border-width: 0px; }
        }

        @keyframes aggressive-spark {
          0% { transform: rotate(var(--r)) translateY(-60px) scaleY(0.5); opacity: 1; }
          100% { transform: rotate(var(--r)) translateY(-450px) scaleY(4); opacity: 0; }
        }

        @keyframes flash {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(2.5); }
        }

        @keyframes float-v2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.02); }
        }

        @keyframes shimmer-fast {
          0% { transform: translateX(-150%) skewX(-25deg); }
          100% { transform: translateX(150%) skewX(-25deg); }
        }
      `}</style>
        </section>
    );
};

export default ALESYOWINHeroV2;
