"use client";

import React, { useEffect, useState } from 'react';

const ALESYOWINHero = () => {
    const [mounted, setMounted] = useState(false);
    const [animationState, setAnimationState] = useState('idle'); // idle -> assemble -> impact -> floating

    useEffect(() => {
        setMounted(true);
        // Sequence timing
        const assembleTimer = setTimeout(() => setAnimationState('assemble'), 100);
        const impactTimer = setTimeout(() => setAnimationState('impact'), 1800);
        const floatingTimer = setTimeout(() => setAnimationState('floating'), 2500);

        return () => {
            clearTimeout(assembleTimer);
            clearTimeout(impactTimer);
            clearTimeout(floatingTimer);
        };
    }, []);

    const handleReplay = () => {
        setAnimationState('idle');
        setTimeout(() => {
            setAnimationState('assemble');
            setTimeout(() => setAnimationState('impact'), 1800);
            setTimeout(() => setAnimationState('floating'), 2500);
        }, 100);
    };

    // Fragment paths (conceptual shards of the logo)
    const fragments = [
        { id: 1, clip: 'polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%)', x: -150, y: -120, r: 45, d: 0.2 },
        { id: 2, clip: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)', x: 200, y: -180, r: -30, d: 0.4 },
        { id: 3, clip: 'polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)', x: -250, y: 150, r: 60, d: 0.1 },
        { id: 4, clip: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)', x: 180, y: 220, r: -45, d: 0.5 },
        { id: 5, clip: 'polygon(25% 25%, 75% 25%, 75% 75%, 25% 75%)', x: 0, y: -300, r: 90, d: 0.3 },
        { id: 6, clip: 'polygon(10% 10%, 40% 10%, 40% 40%, 10% 40%)', x: -300, y: 0, r: -90, d: 0.6 },
        { id: 7, clip: 'polygon(60% 60%, 90% 60%, 90% 90%, 60% 90%)', x: 300, y: 50, r: 120, d: 0.25 },
        { id: 8, clip: 'polygon(40% 0%, 60% 0%, 60% 100%, 40% 100%)', x: -50, y: 250, r: -15, d: 0.45 },
    ];

    if (!mounted) return <div className="min-h-screen bg-black" />;

    return (
        <section className="relative w-full h-screen flex flex-col items-center justify-center bg-black overflow-hidden select-none">
            {/* Background Radial Gradient */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: 'radial-gradient(ellipse at center, #1a1508 0%, #000000 70%)',
                    opacity: animationState === 'idle' ? 0 : 1,
                    transition: 'opacity 2s ease-in'
                }}
            />

            {/* Animation Container */}
            <div className="relative z-10 w-[90vw] max-w-[600px] aspect-[3/1] flex items-center justify-center">

                {/* Fragmented Assembly Layers */}
                {animationState === 'assemble' && fragments.map((f) => (
                    <div
                        key={f.id}
                        className="absolute inset-0 transition-all"
                        style={{
                            clipPath: f.clip,
                            transform: `translate(${f.x}vw, ${f.y}vh) rotate(${f.r}deg) scale(0.2)`,
                            opacity: 0,
                            animation: `assemble-piece 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards`,
                            animationDelay: `${f.d}s`
                        }}
                    >
                        <img
                            src="/logo-principal-orizontal-fara-fundal.png"
                            alt="fragment"
                            className="w-full h-full object-contain brightness-150 contrast-125"
                        />
                    </div>
                ))}

                {/* Impact Visuals */}
                {animationState === 'impact' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Impact Ring */}
                        <div className="absolute w-20 h-20 border-2 border-[#f0d060] rounded-full animate-impact-ring opacity-0" />
                        {/* Sparks Simulation */}
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-8 bg-gradient-to-t from-transparent to-[#f0d060] rounded-full animate-spark"
                                style={{
                                    transform: `rotate(${i * 30}deg) translateY(-100px)`,
                                    animationDelay: '0s'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Final Integrated Logo */}
                <div
                    className={`relative w-full h-full transition-all duration-1000 ${['impact', 'floating'].includes(animationState) ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-110 rotate-3'
                        } ${animationState === 'floating' ? 'animate-float' : ''}`}
                    style={{
                        filter: animationState === 'floating' ? 'drop-shadow(0 0 20px rgba(240, 208, 96, 0.3))' : 'none'
                    }}
                >
                    <img
                        src="/logo-principal-orizontal-fara-fundal.png"
                        alt="ALESYOWIN Logo"
                        className="w-full h-full object-contain"
                    />
                    {/* Gold Glow Overlay */}
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0d060]/20 to-transparent animate-shimmer pointer-events-none mix-blend-overlay"
                    />
                </div>
            </div>

            {/* Typography Overlay */}
            <div
                className={`mt-12 text-center transition-all duration-1000 delay-500 flex flex-col items-center ${['impact', 'floating'].includes(animationState) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
            >
                <h2 className="text-4xl md:text-6xl font-bold tracking-[0.2em] text-[#f0d060] uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                    ALESYOWIN
                </h2>
                <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-[#c8a84b] to-transparent mb-4" />
                <h3 className="text-xl md:text-2xl font-light tracking-[0.5em] text-white/80 uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                    LUXURY GIVEAWAY
                </h3>
            </div>

            {/* Control Actions */}
            {animationState === 'floating' && (
                <button
                    onClick={handleReplay}
                    className="absolute bottom-10 px-6 py-2 border border-[#8b6914] text-[#c8a84b] text-xs tracking-widest uppercase hover:bg-[#8b6914] hover:text-white transition-all duration-300 opacity-60 hover:opacity-100"
                >
                    ↺ Replay Animation
                </button>
            )}

            {/* Global CSS for unique animations */}
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@400;700;900&display=swap');

        @keyframes assemble-piece {
          0% {
            opacity: 0;
            transform: translate(var(--start-x, -50vw), var(--start-y, -50vh)) rotate(var(--start-r, 90deg)) scale(0.1);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
        }

        @keyframes impact-ring {
          0% { transform: scale(0.5); opacity: 1; border-width: 4px; }
          100% { transform: scale(4); opacity: 0; border-width: 0px; }
        }

        @keyframes spark {
          0% { transform: rotate(var(--r)) translateY(-20px) scaleY(0); opacity: 1; }
          50% { transform: rotate(var(--r)) translateY(-150px) scaleY(2); opacity: 1; }
          100% { transform: rotate(var(--r)) translateY(-200px) scaleY(0); opacity: 0; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Specific piece start positions via class-less logic or variables would be better, 
           but for a single-file demo we use the fragments array mapping above */

        .animate-impact-ring {
          animation: impact-ring 0.8s ease-out forwards;
        }

        .animate-spark {
          animation: spark 0.6s ease-out forwards;
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
        </section>
    );
};

export default ALESYOWINHero;
