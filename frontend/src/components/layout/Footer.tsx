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
                                <svg viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[36px] h-auto">
                                    <path d="M14.654 0.25H11.531l-3.078 11.5H11.531l3.123-11.5z" fill="#1434CB"/>
                                    <path d="M7.473 0.25H4.214C3.899 0.25 3.614 0.406 3.473 0.697L0 11.75H3.149L3.778 10H7.625l0.354 1.75h2.784L8.718 0.25H7.473zm-2.88 7.37L5.688 2.37l1.096 5.25H4.593z" fill="#1434CB"/>
                                    <path d="M26.837 0.25h-2.909v11.5h2.909V0.25z" fill="#1434CB"/>
                                    <path d="M37.643 0.25H34.46c-0.34 0-0.638 0.174-0.781 0.463l-4.484 11.037h3.111l0.62-1.721h3.792l0.358 1.721H40L37.643 0.25zm-2.87 7.21l1.104-3.029 0.589 3.029h-1.693z" fill="#1434CB"/>
                                    <path d="M21.996 0.25c-0.812 0-2.316 0.217-3.147 1.054-1.218 1.228-0.902 3.123-0.902 3.123s0.038 1.002 0.73 1.54c0.551 0.428 1.341 0.662 2.146 0.818 1.764 0.339 2.185 0.771 2.185 1.488 0 0.835-0.976 1.455-2.222 1.455-1.144 0-2.383-0.297-3.238-0.793l-0.428 1.954c0.887 0.457 2.224 0.711 3.593 0.711 1.258 0 3.327-0.419 3.327-2.616 0-1.077-0.655-1.89-1.688-2.319-1.391-0.58-1.952-0.87-1.952-1.464 0-0.533 0.589-1.077 1.704-1.077 0.878 0 1.83 0.198 2.457 0.505l0.395-1.821c-0.612-0.28-1.571-0.558-2.96-0.558z" fill="#1434CB"/>
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
