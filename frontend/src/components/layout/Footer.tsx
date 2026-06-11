"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MessageCircle, Phone, Send, Music2, CreditCard } from 'lucide-react';
import { Link } from '../../i18n/routing';
import { SocialIcon } from 'react-social-icons';

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
                    
                    <p className="text-[#00A5FF] font-bold italic text-sm">{t('joinFamily')}</p>
                    
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex items-center gap-3">
                            <Mail size={18} className="text-white" />
                            <a href="mailto:info@alesyowin.com" className="hover:text-white transition-colors">info@alesyowin.com</a>
                        </li>
                    </ul>

                    {/* Company Details */}
                    <div className="pt-4 space-y-1 text-sm text-gray-400 border-t border-white/10 mt-6">
                        <p className="font-bold text-white">{t('companyDetailsName')}</p>
                        <p>{t('companyDetailsNumber')}</p>
                        <p className="pt-2">{t('companyDetailsAddressTitle')}</p>
                        <p>{t('companyDetailsAddress')}</p>
                    </div>
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
                        
                        <div className="flex flex-wrap gap-3 mt-4">
                            <SocialIcon url="#" target="_blank" rel="noopener noreferrer" network="facebook" style={{ height: 42, width: 42 }} className="hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(24,119,242,0.5)] rounded-full" />
                            <SocialIcon url="https://www.instagram.com/alesyo_win" target="_blank" rel="noopener noreferrer" network="instagram" style={{ height: 42, width: 42 }} className="hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(225,48,108,0.5)] rounded-full" />
                            <SocialIcon url="https://www.tiktok.com/@alesyoclub" target="_blank" rel="noopener noreferrer" network="tiktok" style={{ height: 42, width: 42 }} className="hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] rounded-full" />
                            <SocialIcon url="https://www.youtube.com/@Alesyowin" target="_blank" rel="noopener noreferrer" network="youtube" style={{ height: 42, width: 42 }} className="hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(255,0,0,0.5)] rounded-full" />
                            <SocialIcon url="https://api.whatsapp.com/send/?phone=40721715520&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" network="whatsapp" style={{ height: 42, width: 42 }} className="hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(37,211,102,0.5)] rounded-full" />
                            <SocialIcon url="https://t.me/+fjvcRfeBUvwzN2E8" target="_blank" rel="noopener noreferrer" network="telegram" style={{ height: 42, width: 42 }} className="hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(0,136,204,0.5)] rounded-full" />
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                        <div className="relative inline-block">
                            <h3 className="text-lg font-bold uppercase tracking-wider mb-1">{t('paymentMethods')}</h3>
                            <div className="h-0.5 w-12 bg-[#00A5FF]"></div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-4">
                            {/* Mastercard */}
                            <div className="bg-white w-[60px] h-[38px] rounded-md flex items-center justify-center hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(255,95,0,0.4)]">
                                <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[36px] h-[24px]">
                                    <circle cx="8" cy="8" r="8" fill="#EB001B"/>
                                    <circle cx="16" cy="8" r="8" fill="#F79E1B"/>
                                    <path d="M12 14.8c-1.5-1.6-2.5-3.9-2.5-6.8s1-5.2 2.5-6.8c1.5 1.6 2.5 3.9 2.5 6.8s-1 5.2-2.5 6.8z" fill="#FF5F00"/>
                                </svg>
                            </div>

                            {/* Visa */}
                            <div className="bg-white w-[60px] h-[38px] rounded-md flex items-center justify-center hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(20,52,203,0.4)]">
                                <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[36px] h-[24px]">
                                    <path d="M10.2 14.8L11.5 6.7h2.1L12.3 14.8h-2.1zm8.3-7.9c-.3-.1-1-.3-1.8-.3-2 0-3.4 1-3.4 2.6 0 1.1 1.1 1.7 1.8 2 .8.4 1 1 1 1.6 0 1-.9 1.4-1.7 1.4-.9 0-1.5-.2-2.1-.5l-.3-.1-.3 1.9c.5.3 1.5.5 2.4.5 2.1 0 3.5-1 3.5-2.6 0-.8-.5-1.5-1.7-2.1-.7-.3-1.1-.5-1.1-.9 0-.3.4-.8 1.2-.8.6-.1 1.1.1 1.5.2l.2.1.2-1.6z" fill="#1434CB"/>
                                    <path d="M22 6.7h-1.6c-.4 0-.7.2-.9.6l-3.2 7.5h2.2l.4-1.2h2.7l.2 1.2H24L22 6.7zm-2 5l1-2.6 1 2.6h-2z" fill="#1434CB"/>
                                    <path d="M7 6.7L5 12l-.6-3.1c0-.2-.1-.4-.2-.5l-2.4-1.6.4-.1h3.9c.3 0 .6.2.7.5l.8 4.2.9-4.7H7z" fill="#1434CB"/>
                                </svg>
                            </div>
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

export default Footer;
