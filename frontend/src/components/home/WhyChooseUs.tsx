"use client";

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Lock, Users } from 'lucide-react';

export default function WhyChooseUs() {
    const t = useTranslations('Home.features');

    const features = [
        {
            icon: <ShieldCheck className="w-8 h-8 text-[#00A5FF]" />,
            title: t('f1_title'),
            desc: t('f1_desc'),
        },
        {
            icon: <Award className="w-8 h-8 text-[#00A5FF]" />,
            title: t('f2_title'),
            desc: t('f2_desc'),
        },
        {
            icon: <Lock className="w-8 h-8 text-[#00A5FF]" />,
            title: t('f3_title'),
            desc: t('f3_desc'),
        },
        {
            icon: <Users className="w-8 h-8 text-[#00A5FF]" />,
            title: t('f4_title'),
            desc: t('f4_desc'),
        }
    ];

    return (
        <section className="relative py-20 md:py-28 bg-[#030303] border-t border-[#1a1a1a] overflow-hidden">
            {/* Fundal subtil cu gradient radial */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00A5FF]/5 via-[#030303] to-[#030303] pointer-events-none" />
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Secțiune */}
                <div className="text-center mb-16">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl md:text-5xl font-black text-[#00A5FF] uppercase tracking-tight"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {t('title')}
                    </motion.h2>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-1 w-24 bg-[#00A5FF] mx-auto mt-4 rounded-full" 
                    />
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-6 text-gray-300 text-base md:text-lg max-w-2xl mx-auto font-medium"
                    >
                        {t('subtitle')}
                    </motion.p>
                </div>

                {/* Grid Carduri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            className="group relative bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 hover:border-[#00A5FF]/40 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,165,255,0.08)] hover:-translate-y-1"
                        >
                            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-black border border-[#222] group-hover:border-[#00A5FF]/40 group-hover:bg-[#00A5FF]/10 transition-colors duration-300">
                                {feature.icon}
                            </div>
                            <h3 
                                className="text-xl font-bold text-gray-100 mb-3 tracking-wide"
                                style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
