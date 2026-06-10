"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MessageCircle, Phone, Send, Facebook, Youtube, Instagram, Music2 } from 'lucide-react';
import { Link } from '../../i18n/routing';

const Footer = () => {
    const t = useTranslations('Footer');

    return (
        <footer id="footer" className="bg-(--color-black-pure) text-white pt-16 pb-8 px-4 border-t border-white/10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                
                {/* Coloana 1: CONTACT US */}
                <div className="space-y-6">
                    <div className="relative inline-block">
                        <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{t('contactUs')}</h3>
                        <div className="h-0.5 w-12 bg-(--color-gold)"></div>
                    </div>
                    
                    <p className="text-(--color-gold) font-bold italic text-sm">{t('tagline')}</p>
                    
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex items-center gap-3">
                            <Send size={18} className="text-white" />
                            <a href="https://t.me/yourchannel" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                {t('telegram')}
                            </a>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone size={18} className="text-white" />
                            <a href="tel:+447700900555" className="hover:text-white transition-colors">+44 7700 900555</a>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail size={18} className="text-white" />
                            <a href="mailto:info@gpcompetition.com" className="hover:text-white transition-colors">{t('email')}</a>
                        </li>
                        <li className="flex items-start gap-3 mt-4 pt-4 border-t border-white/5">
                            <div className="space-y-1">
                                <p className="text-white font-semibold uppercase tracking-tighter">{t('companyName')}</p>
                                <p className="text-xs uppercase opacity-70">{t('companyNumber', { number: '17127347' })}</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Coloana 2: LEGAL */}
                <div className="space-y-6">
                    <div className="relative inline-block">
                        <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{t('legal')}</h3>
                        <div className="h-0.5 w-12 bg-(--color-gold)"></div>
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
                            <div className="h-0.5 w-12 bg-(--color-gold)"></div>
                        </div>
                        
                        <div className="flex gap-3">
                            <SocialIcon href="https://www.facebook.com/profile.php?id=61574236922040" icon={<Facebook size={18} fill="currentColor" />} />
                            <SocialIcon href="https://www.tiktok.com/@gpcompetition" icon={<Music2 size={18} />} />
                            <SocialIcon href="https://www.instagram.com/gpcompetitionn/" icon={<Instagram size={18} />} />
                            <SocialIcon href="https://www.youtube.com/@GpCompetition-uk" icon={<Youtube size={18} />} />
                            <SocialIcon href="#" icon={<Send size={18} fill="currentColor" />} />
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                        <div className="relative inline-block">
                            <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{t('paymentMethods')}</h3>
                            <div className="h-0.5 w-12 bg-(--color-gold)"></div>
                        </div>
                        
                        {/* Payment Methods Image */}
                        <div className="space-y-2 pt-2">
                            <img 
                                src="/PaytriotFooterMain1.png" 
                                alt="Payment Methods" 
                                className="w-full max-w-[280px] h-auto object-contain transition-transform hover:scale-[1.02]"
                            />
                            <p className="text-[10px] text-white/40 tracking-tight">
                                Secure payments powered by Paytriot
                            </p>
                        </div>
                    </div>




                </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 pt-8 text-center space-y-2">
                <p className="text-xs text-white/80">
                    &copy; {new Date().getFullYear()} {t('companyName')}. {t('rights')}
                </p>
                <p className="text-[10px] text-white/60">
                    GP COMPETITIONS&reg; {t('trademark', { name: '' })}
                </p>
                <p className="text-[10px] text-white/60 max-w-2xl mx-auto">
                    {t('unauthorised')}
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
        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-(--color-gold) hover:text-black transition-all"
    >
        {icon}
    </a>
)

export default Footer;
