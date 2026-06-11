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
                            <div className="bg-white w-[60px] h-[38px] rounded-md flex items-center justify-center p-1.5 hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(255,95,0,0.4)]">
                                <img src="/mastercard.svg" alt="Mastercard" className="w-full h-full object-contain" />
                            </div>

                            {/* Visa */}
                            <div className="bg-white w-[60px] h-[38px] rounded-md flex items-center justify-center p-1.5 hover:scale-110 transition-transform hover:shadow-[0_0_15px_rgba(20,52,203,0.4)]">
                                <img src="/visa.svg" alt="Visa" className="w-full h-full object-contain" />
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
