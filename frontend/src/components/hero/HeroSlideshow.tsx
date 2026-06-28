"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const images = [
    '/hero-x-6/1.webp',
    '/hero-x-6/2.webp',
    '/hero-x-6/3.webp',
    '/hero-x-6/4.webp',
    '/hero-x-6/5.webp',
    '/hero-x-6/6.webp',
];

export default function HeroSlideshow() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 7000); // Schimbăm slide-ul la fiecare 7 secunde (durata totală a afișării unui slide)

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setNextIndex((currentIndex + 1) % images.length);
    }, [currentIndex]);

    return (
        <div className="absolute inset-0 overflow-hidden bg-black z-0">
            {images.map((src, index) => {
                const isActive = index === currentIndex;
                const isNext = index === nextIndex;

                // Randăm doar slide-ul activ și următorul pentru optimizarea memoriei și a vitezei
                if (!isActive && !isNext) return null;

                return (
                    <div
                        key={src}
                        className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
                            isActive ? 'opacity-60 z-[1]' : 'opacity-0 z-0'
                        }`}
                    >
                        <div 
                            className={`w-full h-full relative ${
                                isActive ? 'animate-kenburns' : ''
                            }`}
                        >
                            <Image
                                src={src}
                                alt={`Hero Slideshow Image ${index + 1}`}
                                fill
                                priority={index === 0}
                                className="object-cover object-center"
                                sizes="100vw"
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
