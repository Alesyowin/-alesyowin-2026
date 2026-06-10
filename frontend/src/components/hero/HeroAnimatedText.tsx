"use client";

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function HeroAnimatedText() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto drop-shadow-2xl"
        >
            <h1 
                className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tight leading-tight uppercase mb-6"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
                <span className="block mb-2 text-[#00A5FF]">Mulțumim pentru răbdare!</span>
                <span className="block text-3xl md:text-4xl lg:text-5xl mt-4 font-bold text-gray-200">Am revenit. Competiția merge mai departe.</span>
            </h1>
        </motion.div>
    );
}
