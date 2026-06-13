"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '../../i18n/routing';
import LanguageSelector from './LanguageSelector';
import { ShoppingCart, User, LogOut, ChevronDown } from 'lucide-react';
import { useCartStore } from '../../lib/store';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const t = useTranslations('Navbar');
    const { getItemCount, setCartOpen } = useCartStore();
    const { user, logout, isLoading } = useAuth();

    // Hydration safe mounting
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const itemCount = mounted ? getItemCount() : 0;

    const navLinks = [
        { name: t('home'), href: '/' },
        { name: t('apartments'), href: '/category/apartments' },
        { name: t('cars'), href: '/category/cars' },
        { name: t('cash'), href: '/category/cash' },
        { name: t('tech'), href: '/category/tech' },
        { name: t('entryList'), href: '/entry-list' },
        { name: t('contact'), href: '#footer' },
    ];

    const getInitials = () => {
        if (!user) return "";
        if (user.First_Name && user.Last_Name) {
            return `${user.First_Name[0]}.${user.Last_Name[0]}.`;
        }
        return user.email[0].toUpperCase() + ".";
    };

    return (
        <nav className="fixed w-full z-[9999] bg-[#000]/95 border-b border-[#00A5FF]/20 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">

                    {/* Logo Section */}
                    <div className="flex items-center flex-shrink-0 pr-2 lg:pr-6">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo-principal-transparent.webp"
                                alt="Alesyowin Logo"
                                width={300}
                                height={100}
                                className="w-auto h-14 md:h-16 lg:h-24 xl:h-28 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] contrast-125 saturate-150 transition-transform hover:scale-105"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Desktop Menu - Flexibil și Automat */}
                    <div className="hidden md:flex md:items-center md:justify-evenly md:flex-1 min-w-0 md:px-1 lg:px-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-gray-300 hover:text-(--color-gold) px-1 lg:px-1.5 xl:px-2 py-2 text-[9px] md:text-[10px] lg:text-[11px] xl:text-[12px] font-bold transition-colors uppercase tracking-tight md:tracking-normal whitespace-nowrap"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Actions & Language Selector */}
                    <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4 xl:space-x-6 flex-shrink-0 pl-2 lg:pl-6">
                        <LanguageSelector />

                        {/* Cart Button */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative p-2 text-gray-300 hover:text-(--color-gold) transition-colors"
                        >
                            <ShoppingCart size={22} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-2 flex min-w-[20px] h-5 px-1.5 items-center justify-center rounded-full bg-[#00A5FF] text-[10px] font-black text-black border-2 border-black z-10 shadow-sm">
                                    {itemCount}
                                </span>
                            )}
                        </button>

                        {/* Auth Section */}
                        {isLoading ? (
                            <div className="w-24 h-10 bg-white/5 animate-pulse rounded" />
                        ) : user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 group"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-(--color-gold-dark) to-(--color-gold-light) rounded-full flex items-center justify-center text-xs font-black text-black shadow-[0_0_15px_rgba(0,165,255,0.2)] group-hover:scale-105 transition-transform border border-(--color-gold)/20">
                                        {getInitials()}
                                    </div>
                                    <ChevronDown size={14} className={`text-(--color-gold)/60 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isProfileOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-0" 
                                            onClick={() => setIsProfileOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-3 w-56 bg-black border border-[#00A5FF] rounded-sm shadow-2xl py-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <Link
                                                href="/profile"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold text-white hover:bg-(--color-gold)/10 hover:text-(--color-gold) transition-colors"
                                            >
                                                <User size={16} />
                                                {t('profile')}
                                            </Link>
                                            <div className="h-px bg-white/5 mx-2 my-1" />
                                            <button
                                                onClick={() => {
                                                    setIsProfileOpen(false);
                                                    logout();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <LogOut size={16} />
                                                {t('logout')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link 
                                href="/login" 
                                className="bg-[#00A5FF] text-white hover:bg-[#008ecc] uppercase tracking-wide lg:tracking-widest font-bold text-[10px] lg:text-xs xl:text-sm py-2 px-3 xl:py-2.5 xl:px-6 rounded-md transition-all transform hover:scale-105 shadow-[0_4px_10px_rgba(0,165,255,0.4)] whitespace-nowrap"
                                style={{ 
                                    backgroundColor: '#00A5FF',
                                    opacity: 1,
                                    visibility: 'visible',
                                    zIndex: 999,
                                    position: 'relative',
                                    display: 'inline-block'
                                }}
                            >
                                {t('login')}
                            </Link>
                        )}
                    </div>

                    {/* Mobile: Language Selector, Cart & Menu Button */}
                    <div className="flex items-center space-x-3 md:hidden">
                        <LanguageSelector />

                        {/* Mobile Cart Button */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative p-2 text-gray-300 hover:text-(--color-gold) transition-colors"
                        >
                            <ShoppingCart size={22} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-2 flex min-w-[16px] h-4 px-1.5 items-center justify-center rounded-full bg-[#00A5FF] text-[9px] font-black text-black border border-black z-10 shadow-sm">
                                    {itemCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-(--color-gold) hover:text-(--color-gold-light) hover:bg-(--color-black-soft) focus:outline-none transition-colors"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            <div className={`md:hidden absolute w-full bg-(--color-black-rich) border-b border-(--color-gold)/20 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3 flex flex-col items-center">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="text-[#111111] hover:text-[#00A5FF] block px-3 py-4 text-sm font-black text-center w-full uppercase tracking-widest border-b border-gray-200"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="mt-8 flex flex-col items-center w-full px-4">
                        {isLoading ? (
                            <div className="w-full h-12 bg-white/5 animate-pulse rounded" />
                        ) : user ? (
                            <div className="w-full space-y-3 pt-4 border-t border-white/5">
                                <Link
                                    href="/profile"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-3 w-full py-4 text-xs font-black uppercase tracking-widest text-(--color-gold)"
                                >
                                    <User size={18} />
                                    {t('profile')}
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        logout();
                                    }}
                                    className="flex items-center justify-center gap-3 w-full py-4 text-xs font-black uppercase tracking-widest text-red-400 bg-red-400/5 rounded-sm"
                                >
                                    <LogOut size={18} />
                                    {t('logout')}
                                </button>
                            </div>
                        ) : (
                            <Link 
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="w-full bg-[#00A5FF] text-white uppercase tracking-widest font-black py-4 px-6 rounded-md shadow-[0_4px_10px_rgba(0,165,255,0.4)] text-center"
                                style={{ 
                                    backgroundColor: '#00A5FF',
                                    opacity: 1,
                                    visibility: 'visible',
                                    zIndex: 999,
                                    position: 'relative',
                                    display: 'inline-block'
                                }}
                            >
                                {t('login')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
