"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useCartStore } from '../../../lib/store';
import { useState, useEffect } from 'react';
import { useRouter } from '../../../i18n/routing';
import { useAuth } from '../../../contexts/AuthContext';

export default function CheckoutContent({ clientSecret }: { clientSecret: string | null }) {
    const t = useTranslations('Checkout');
    const tCart = useTranslations('Cart');
    const locale = useLocale();
    const { items, getTotal, clearCart } = useCartStore();
    const { user, refreshUser } = useAuth();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        county: '',
        postal_code: '',
        country: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-fill logged in user data
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: prev.firstName || user.First_Name || '',
                lastName: prev.lastName || user.Last_Name || '',
                email: prev.email || user.email || '',
                phone: prev.phone || user.phone || ''
            }));
        }
    }, [user]);

    if (!mounted) return null;

    const total = getTotal();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);

        try {
            // 1. Creăm comanda în Backend (Directus - status: pending)
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer: formData,
                    items: items,
                    total: total,
                    locale: locale,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('errorProcessing'));
            }

            await refreshUser();

            if (data.orderCode) {
                const checkoutUrl = process.env.NEXT_PUBLIC_VIVA_CHECKOUT_URL || 'https://demo.vivapayments.com/web/checkout';
                window.location.href = `${checkoutUrl}?ref=${data.orderCode}`;
            } else {
                throw new Error("Nu s-a putut genera codul de plată Viva.");
            }

        } catch (error: any) {
            console.error('Checkout error:', error);
            alert(`${t('errorProcessing')}: ${error.message}`);
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h1
                className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest mb-12"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
                {t('title')}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left side: Customer Form */}
                <div className="bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-sm p-6 md:p-8">
                    <h2 className="text-xl font-bold text-[#D4AF37] uppercase tracking-widest mb-6">
                        {t('formTitle')}
                    </h2>

                    <form onSubmit={handleCheckout} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                    {t('firstName')}
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                    {t('lastName')}
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                {t('email')}
                            </label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                {t('phone')}
                            </label>
                            <input
                                required
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                            />
                        </div>

                        {/* Billing Section */}
                        <div className="pt-6 border-t border-[#D4AF37]/20 mt-8 mb-6">
                            <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-widest mb-6">
                                {t('billingTitle')}
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                        {t('address')}
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                            {t('city')}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                            {t('county')}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="county"
                                            value={formData.county}
                                            onChange={handleChange}
                                            className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                            {t('postalCode')}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="postal_code"
                                            value={formData.postal_code}
                                            onChange={handleChange}
                                            className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                            {t('country')}
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || items.length === 0}
                            className={`
                                w-full py-4 px-8 rounded-sm font-black uppercase tracking-[0.3em] text-sm
                                transition-all duration-300 relative overflow-hidden btn-gold-safe mt-6
                                ${isSubmitting || items.length === 0
                                    ? 'bg-[#222] text-white/30 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#8b6914] via-[#D4AF37] to-[#f0d060] btn-gold-safe text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] flex items-center justify-center'
                                }
                            `}
                            style={{ 
                                backgroundColor: '#D4AF37',
                                opacity: 1,
                                visibility: 'visible',
                                zIndex: 999,
                                position: 'relative',
                                display: 'inline-block'
                            }}
                        >
                            {isSubmitting ? t('processing') : t('payNow')}
                        </button>
                    </form>
                </div>

                {/* Right side: Order Summary */}
                <div className="bg-[#050505] border border-[#D4AF37]/10 rounded-sm p-6 md:p-8 h-fit sticky top-28">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6">
                        {t('summary')}
                    </h2>

                    <div className="space-y-4 mb-8">
                        {items.length === 0 ? (
                            <p className="text-white/40">{tCart('empty')}</p>
                        ) : (
                            items.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex justify-between items-center py-4 border-b border-[#D4AF37]/10">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 bg-[#111] border border-[#D4AF37]/20 flex items-center justify-center p-1 rounded-sm shrink-0 hidden sm:flex">
                                            {item.image ? (
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[#D4AF37] text-xs">IMG</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-white font-bold uppercase text-sm tracking-wide truncate">{item.title}</p>
                                            <p className="text-white/50 text-xs mt-1">{t('qty')}: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="text-[#D4AF37] font-bold ml-4 shrink-0">
                                        £{Number(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-[#D4AF37]/30">
                        <span className="text-white font-bold uppercase tracking-widest">{tCart('total')}</span>
                        <span className="text-3xl font-black text-[#D4AF37]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            £{Number(total).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
