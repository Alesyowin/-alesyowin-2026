"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MessageCircle, Phone, Send, Facebook, Youtube, Instagram, Music2, CreditCard } from 'lucide-react';
import { Link } from '../../i18n/routing';

const Footer = () => {
    const t = useTranslations('Footer');

    return (
        <footer id="footer" className="bg-[#000] text-white pt-16 pb-8 px-4 border-t border-white/10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                
                {/* Coloana 1: CONTACT US */}
                <div className="space-y-6">
                    <div className="relative inline-block">
                        <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{t('contactUs')}</h3>
                        <div className="h-0.5 w-12 bg-[#00A5FF]"></div>
                    </div>
                    
                    <p className="text-[#00A5FF] font-bold italic text-sm">Join the Alesywin family today!</p>
                    
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex items-center gap-3">
                            <Mail size={18} className="text-white" />
                            <a href="mailto:andreialexandruuk25@gmail.com" className="hover:text-white transition-colors">andreialexandruuk25@gmail.com</a>
                        </li>
                    </ul>
                </div>

                {/* Coloana 2: LEGAL */}
                <div className="space-y-6">
                    <div className="relative inline-block">
                        <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{t('legal')}</h3>
                        <div className="h-0.5 w-12 bg-[#00A5FF]"></div>
                    </div>
                    
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><Link href="/terms" className="hover:text-white transition-colors">{t('terms')}</Link></li>
                        <li><Link href="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link></li>
                        <li><Link href="/rules" className="hover:text-white transition-colors">{t('rules')}</Link></li>
                        <li><Link href="/postal-entry" className="hover:text-white transition-colors">{t('postal')}</Link></li>
                        <li><Link href="/cookies" className="hover:text-white transition-colors">{t('cookies')}</Link></li>
                        <li><Link href="/faq" className="hover:text-white transition-colors">{t('faq')}</Link></li>
                    </ul>

                    {/* Badge 18+ */}
                    <div className="pt-4">
                       <div className="w-10 h-10 rounded-full border-2 border-red-600 flex items-center justify-center text-red-600 font-bold text-xs">
                          18+
                       </div>
                    </div>
                </div>

                {/* Coloana 3: KEEP IN TOUCH & PAYMENTS */}
                <div className="space-y-8">
                    {/* Social Media */}
                    <div className="space-y-4">
                        <div className="relative inline-block">
                            <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{t('keepInTouch')}</h3>
                            <div className="h-0.5 w-12 bg-[#00A5FF]"></div>
                        </div>
                        
                        <div className="flex gap-3">
                            <SocialIcon href="#" icon={<Facebook size={18} fill="currentColor" />} />
                            <SocialIcon href="#" icon={<Instagram size={18} />} />
                            <SocialIcon href="#" icon={<Youtube size={18} />} />
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                        <div className="relative inline-block">
                            <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{t('paymentMethods')}</h3>
                            <div className="h-0.5 w-12 bg-[#00A5FF]"></div>
                        </div>
                        
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-3 text-gray-300">
                                <CreditCard size={32} />
                                <span>Secured by Stripe</span>
                            </div>
                            <p className="text-[10px] text-white/40 tracking-tight">
                                We accept all major credit and debit cards securely through Stripe.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 pt-8 text-center space-y-2">
                <p className="text-xs text-white/80">
                    &copy; {new Date().getFullYear()} Alesywin. All Rights Reserved.
                </p>
                <p className="text-[10px] text-white/60">
                    ALESYWIN&reg;
                </p>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon, href }: { icon: React.ReactNode, href: string }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#00A5FF] hover:text-white transition-all"
    >
        {icon}
    </a>
)

export default Footer;
