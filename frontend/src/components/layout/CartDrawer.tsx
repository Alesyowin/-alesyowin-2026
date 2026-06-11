"use client";

import { useTranslations, useLocale } from 'next-intl';
import { useCartStore, CartItem } from '../../lib/store';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from '../../i18n/routing';
import { useEffect, useState } from 'react';

export default function CartDrawer() {
    const t = useTranslations('Cart');
    const router = useRouter();
    const { items, isCartOpen, setCartOpen, updateQuantity, removeItem, getTotal } = useCartStore();

    // Tratăm problema de hidratare
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // La fiecare montare a componentei (navigare de pagină în Next.js),
    // închidem coșul dacă nu are produse — previne redeschiderea automată la schimbarea rutei
    useEffect(() => {
        if (items.length === 0) {
            setCartOpen(false);
        }
    }, []);

    // isVisible controlează dacă panoul există în DOM
    // Rămâne true încă 500ms după închidere, cât durează animația CSS de slide-out
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Gestionează prezența în DOM (mount/unmount cu 500ms delay la închidere)
    useEffect(() => {
        if (isCartOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isCartOpen]);

    // Gestionează animația CSS (delay 20ms la deschidere, instant la închidere)
    useEffect(() => {
        if (isCartOpen) {
            const t = setTimeout(() => setIsOpen(true), 20);
            return () => clearTimeout(t);
        } else {
            setIsOpen(false);
        }
    }, [isCartOpen]);

    if (!mounted) return null;

    const total = getTotal();

    return (
        <>
            {/* Overlay Backdrop */}
            {isCartOpen && items.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/90 z-[99999] transition-opacity"
                    onClick={() => setCartOpen(false)}
                />
            )}

            {/* Drawer Panel — în DOM doar cât e vizibil sau cât durează animația, evitând interferența cu tool-uri externe (Meta, TikTok) */}
            {isVisible && (
            <div
                className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0A0A0A] border-l border-[#00A5FF]/20 z-[99999] shadow-2xl flex flex-col"
                style={{
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#00A5FF]/10 bg-[#000]">
                    <div className="flex items-center gap-3 text-[#00A5FF]">
                        <ShoppingCart size={24} />
                        <h2
                            className="text-xl font-bold uppercase tracking-widest"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                            {t('title')}
                        </h2>
                    </div>
                    <button
                        onClick={() => setCartOpen(false)}
                        className="text-white/50 hover:text-white transition-colors p-2"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p className="tracking-widest uppercase">{t('empty')}</p>
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex items-center gap-4 border border-[#00A5FF]/10 bg-[#111] p-4 rounded-sm"
                            >
                                {/* Image Placeholder */}
                                <div className="w-16 h-16 shrink-0 bg-[#1A1A1A] border border-[#00A5FF]/20 flex items-center justify-center overflow-hidden">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className="text-sm font-bold text-white truncate uppercase tracking-widest"
                                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                                    >
                                        {item.title}
                                    </h3>
                                    <p className="text-[#00A5FF] font-bold text-sm">£{Number(item.price).toFixed(2)}</p>

                                {/* Quantity Controls */}
                                    <div className="flex items-center gap-3 mt-3">
                                        {item.price === 0 ? (
                                            // Produs gratuit — nu permiţem modificarea cantității
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-white/40 border border-white/10 px-3 py-1 rounded-sm">
                                                    1 ×
                                                </span>
                                                <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-1 rounded-sm font-bold uppercase tracking-wide">
                                                    Free
                                                </span>
                                            </div>
                                        ) : (
                                            // Produs plătit — controale normale de cantitate
                                            <div className="flex items-center border border-[#00A5FF]/30 rounded-sm overflow-hidden bg-black">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="px-2 py-1 text-[#00A5FF] hover:bg-[#00A5FF]/10 transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="px-3 text-xs font-bold text-white w-8 text-center border-x border-[#00A5FF]/30">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="px-2 py-1 text-[#00A5FF] hover:bg-[#00A5FF]/10 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500/50 hover:text-red-500 transition-colors ml-auto p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer (Total & Checkout) */}
                {items.length > 0 && (
                    <div className="p-6 border-t border-[#00A5FF]/20 bg-[#050505]">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-white/60 uppercase tracking-widest text-sm">{t('total')}</span>
                            <span
                                className="text-3xl font-black text-[#00A5FF]"
                                style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                                £{Number(total).toFixed(2)}
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                setCartOpen(false);
                                router.push('/checkout');
                            }}
                            className="w-full py-4 bg-gradient-to-r from-[#008ecc] via-[#00A5FF] to-[#3498db] btn-gold-safe text-black font-black uppercase tracking-[0.2em] rounded-sm hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(0,165,255,0.3)] mb-3"
                        >
                            {t('checkout')}
                        </button>

                        <button
                            onClick={() => {
                                setCartOpen(false);
                                router.push('/#active-competitions');
                            }}
                            className="w-full py-3 border border-[#00A5FF]/30 text-[#00A5FF]/70 hover:text-[#00A5FF] hover:border-[#00A5FF] hover:bg-[#00A5FF]/5 font-bold uppercase tracking-[0.1em] text-[10px] rounded-sm transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            {t('continueShopping')}
                        </button>
                    </div>
                )}
            </div>
            )}
        </>
    );
}
