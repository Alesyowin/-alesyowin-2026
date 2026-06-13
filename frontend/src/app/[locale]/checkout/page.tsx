"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '../../../contexts/AuthContext';
import { useCartStore } from '../../../lib/store';
import { useState, useEffect, useRef } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '../../../components/StripePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
    const t = useTranslations('Checkout');
    const tCart = useTranslations('Cart');
    const locale = useLocale();
    const { items, getTotal, clearCart } = useCartStore();
    const { user, refreshUser } = useAuth();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Starea formularului client
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

    const [paymentError, setPaymentError] = useState<string | null>(null);
    
    // Protecție suplimentară contra dublu-click
    const isProcessingRef = useRef(false);

    // Stări pentru Promo Code
    const [promoInput, setPromoInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<{code: string, discount: number, applicableList: number[]} | null>(null);
    const [promoMessage, setPromoMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);

    // Auto-fill pentru utilizatorul deja logat
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

    // Preia eroarea din URL daca utilizatorul e redirectionat inapoi dupa o plata refuzata
    useEffect(() => {
        if (!mounted) return;
        const searchParams = new URLSearchParams(window.location.search);
        const err = searchParams.get('paymentError');
        if (err === 'declined') {
            setPaymentError(t('paymentRefused') || 'Plata a fost refuzată de bancă sau a intervenit o eroare. Vă rugăm să încercați din nou.');
        } else if (err === 'invalid_signature') {
            setPaymentError('Eroare la validarea securității tranzacției.');
        } else if (err) {
            setPaymentError('Eroare de procesare: ' + err);
        }
    }, [mounted, t]);

    if (!mounted) return null;

    const baseTotal = getTotal();
    let discountValue = 0;
    if (appliedPromo) {
        if (appliedPromo.applicableList && appliedPromo.applicableList.length > 0) {
            let eligibleTotal = 0;
            items.forEach(item => {
                if (appliedPromo.applicableList.includes(parseInt(item.id, 10))) {
                    eligibleTotal += (Number(item.price) * item.quantity);
                }
            });
            discountValue = (eligibleTotal * appliedPromo.discount) / 100;
        } else {
            discountValue = (baseTotal * appliedPromo.discount) / 100;
        }
    }
    const total = Math.max(0, baseTotal - discountValue);

    const handleApplyPromo = async () => {
        if (!promoInput.trim()) return;
        setIsApplyingPromo(true);
        setPromoMessage(null);
        try {
            const res = await fetch('/api/promo/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promoCode: promoInput, cartItems: items })
            });
            const data = await res.json();
            if (data.valid) {
                setAppliedPromo({ code: data.code, discount: data.discount_percentage, applicableList: data.applicableList || [] });
                setPromoMessage({ text: t('promoSuccess'), type: 'success' });
            } else {
                setAppliedPromo(null);
                setPromoMessage({ text: data.error || t('promoError'), type: 'error' });
            }
        } catch (error) {
            setPromoMessage({ text: t('promoError'), type: 'error' });
        } finally {
            setIsApplyingPromo(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /**
     * Funcție apelată de StripePaymentForm ÎNAINTE de confirmarea plății.
     * Creează comanda + PaymentIntent și returnează clientSecret + returnUrl.
     * Dacă totalul e £0, procesează gratuit și returnează null (redirect direct).
     */
    const handleBeforeConfirm = async (): Promise<{ clientSecret: string; returnUrl: string; billingDetails?: any } | null> => {
        // Protecție contra dublu-click
        if (isProcessingRef.current) return null;
        isProcessingRef.current = true;
        setPaymentError(null);

        // Generare Event ID comun pentru dedublare Meta
        const initiateCheckoutEventId = crypto.randomUUID();

        // META CAPI: InitiateCheckout
        fetch('/api/meta-conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: 'InitiateCheckout',
                eventId: initiateCheckoutEventId,
                eventSourceUrl: window.location.href,
                userData: {
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    city: formData.city,
                    zip: formData.postal_code,
                    country: formData.country,
                },
                customData: {
                    value: total,
                    currency: 'GBP',
                    contentIds: items.map(i => i.id),
                    contents: items.map(i => ({ id: i.id, quantity: i.quantity, item_price: Number(i.price) }))
                }
            })
        }).catch(() => null);

        // META PIXEL (Frontend): InitiateCheckout
        if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'InitiateCheckout', {
                value: total,
                currency: 'GBP',
                content_ids: items.map(i => i.id),
                contents: items.map(i => ({ id: i.id, quantity: i.quantity, item_price: Number(i.price) }))
            }, { eventID: initiateCheckoutEventId });
        }

        // TIKTOK S2S: InitiateCheckout
        fetch('/api/tiktok-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'InitiateCheckout',
                url: window.location.href,
                properties: {
                    value: total,
                    currency: 'GBP',
                    contents: items.map(i => ({ content_id: i.id, quantity: i.quantity, price: Number(i.price) }))
                }
            })
        }).catch(() => null);

        try {
            // Verificăm limita minimă de bilete
            const invalidItem = items.find(item => item.minTickets && item.quantity < item.minTickets);
            if (invalidItem) {
                setPaymentError(`You must select at least ${invalidItem.minTickets} tickets for ${invalidItem.title}.`);
                isProcessingRef.current = false;
                return null;
            }

            // Validăm câmpurile obligatorii din formular
            const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'county', 'postal_code', 'country'] as const;
            for (const field of requiredFields) {
                if (!formData[field]?.trim()) {
                    setPaymentError(t('errorProcessing'));
                    isProcessingRef.current = false;
                    return null;
                }
            }

            // --- PASUL 1: Creăm comanda în Directus ---
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: formData,
                    items: items,
                    total: total,
                    locale: locale,
                    quizGiveawayId: items[0]?.id,
                    quizAnswer: items[0]?.quizAnswer,
                    promoCode: appliedPromo?.code || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('errorProcessing'));
            }

            console.log(`[Checkout] Comanda creată cu ID: ${data.orderId}. Total: £${total}`);

            // --- BYPASS PLATĂ PENTRU CONCURSURI GRATUITE (£0) ---
            if (total === 0) {
                const mockResponse = await fetch('/api/mock-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: data.orderId }),
                });

                if (!mockResponse.ok) {
                    throw new Error('Free order processing failed');
                }

                const purchaseEventId = crypto.randomUUID();
                sessionStorage.setItem('pendingPurchaseData', JSON.stringify({
                    total, currency: 'GBP', eventId: purchaseEventId,
                    userData: { email: formData.email, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone, city: formData.city, zip: formData.postal_code, country: formData.country },
                    contentIds: items.map(i => i.id), orderId: data.orderId
                }));

                clearCart();
                await refreshUser();
                window.location.href = `/${locale}/success?orderId=${data.orderId}`;
                return null;
            }

            // --- PASUL 2: Creăm PaymentIntent ---
            const intentResponse = await fetch('/api/stripe/payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderId }),
            });

            const intentResult = await intentResponse.json();

            if (!intentResponse.ok || !intentResult.clientSecret) {
                throw new Error(intentResult.error || 'Failed to initialize payment');
            }

            // Salvăm datele pentru evenimentul Purchase pe pagina de success
            const purchaseEventId = crypto.randomUUID();
            sessionStorage.setItem('pendingPurchaseData', JSON.stringify({
                total, currency: 'GBP', eventId: purchaseEventId,
                userData: { email: formData.email, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone, city: formData.city, zip: formData.postal_code, country: formData.country },
                contentIds: items.map(i => i.id), orderId: data.orderId
            }));

            // Stripe cere cod ISO de 2 litere pentru țară
            let stripeCountry = formData.country.trim();
            if (stripeCountry.length > 2) {
                const map: Record<string, string> = {
                    'romania': 'RO', 'românia': 'RO',
                    'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'england': 'GB',
                    'germany': 'DE', 'germania': 'DE', 'deutschland': 'DE',
                    'france': 'FR', 'franța': 'FR', 'franta': 'FR',
                    'italy': 'IT', 'italia': 'IT',
                    'spain': 'ES', 'spania': 'ES', 'españa': 'ES',
                    'usa': 'US', 'united states': 'US', 'america': 'US',
                    'ireland': 'IE', 'irlanda': 'IE'
                };
                stripeCountry = map[stripeCountry.toLowerCase()] || '';
            } else {
                stripeCountry = stripeCountry.toUpperCase();
            }

            return {
                clientSecret: intentResult.clientSecret,
                returnUrl: `${window.location.origin}/${locale}/success?orderId=${data.orderId}`,
                billingDetails: {
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                        line1: formData.address,
                        city: formData.city,
                        state: formData.county,
                        postal_code: formData.postal_code,
                        ...(stripeCountry.length === 2 && { country: stripeCountry }),
                    }
                }
            };

        } catch (error: any) {
            console.error('Eroare checkout:', error);
            setPaymentError(error.message || t('errorProcessing'));
            return null;
        } finally {
            isProcessingRef.current = false;
        }
    };

    // Funcția veche de submit a formularului - acum doar pentru comenzi gratuite
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (total === 0) {
            await handleBeforeConfirm();
        }
    };

    return (
        <div className="min-h-screen bg-black w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 font-sans relative">
                <h1
                className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest mb-12"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
                {t('title')}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Coloana stânga: Formular date client + Plată */}
                <div className="bg-black border border-[#00A5FF] rounded-sm p-6 md:p-8">
                    <h2 className="text-xl font-bold text-[#00A5FF] uppercase tracking-widest mb-6">
                        {t('formTitle')}
                    </h2>

                    <div className="space-y-6">
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
                                    className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
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
                                    className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
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
                                className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
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
                                className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
                            />
                        </div>

                        {/* Adresa de facturare */}
                        <div className="pt-6 border-t border-[#00A5FF]/20 mt-8 mb-6">
                            <h3 className="text-lg font-bold text-[#00A5FF] uppercase tracking-widest mb-6">
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
                                        className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
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
                                            className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
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
                                            className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
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
                                            className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                                            {t('country')}
                                        </label>
                                        <select
                                            required
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors appearance-none"
                                        >
                                            <option value="">{t('country')}</option>
                                            <option value="RO">România</option>
                                            <option value="GB">United Kingdom (Marea Britanie)</option>
                                            <option value="DE">Germania (Deutschland)</option>
                                            <option value="FR">Franța (France)</option>
                                            <option value="IT">Italia</option>
                                            <option value="ES">Spania (España)</option>
                                            <option value="IE">Irlanda (Ireland)</option>
                                            <option value="US">Statele Unite (USA)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mesaj de eroare plată */}
                        {paymentError && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-sm px-4 py-3 text-red-400 text-sm">
                                ⚠️ {paymentError}
                            </div>
                        )}

                        {/* Secțiunea de plată cu card - vizibilă direct */}
                        {total > 0 ? (
                            <div className="pt-6 border-t border-[#00A5FF]/20 mt-2">
                                <h3 className="text-lg font-bold text-[#00A5FF] uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <svg className="w-6 h-6 text-[#00A5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    {t('paymentTitle')}
                                </h3>
                                
                                <Elements 
                                    stripe={stripePromise} 
                                    options={{ 
                                        mode: 'payment' as const,
                                        amount: Math.round(total * 100),
                                        currency: 'gbp',
                                        appearance: { 
                                            theme: 'night' as const, 
                                            variables: { 
                                                colorPrimary: '#00A5FF', 
                                                colorBackground: '#111111', 
                                                colorText: '#ffffff',
                                                colorDanger: '#ef4444'
                                            } 
                                        } 
                                    }}
                                >
                                    <StripePaymentForm 
                                        amount={total}
                                        buttonText={t('payNow')}
                                        processingText={t('processing')}
                                        onBeforeConfirm={handleBeforeConfirm}
                                    />
                                </Elements>
                            </div>
                        ) : (
                            <form onSubmit={handleCheckout}>
                                <button
                                    type="submit"
                                    disabled={items.length === 0}
                                    className="w-full py-4 px-8 rounded-sm font-black uppercase tracking-[0.3em] text-sm transition-all duration-300 mt-8 bg-gradient-to-r from-[#008ecc] via-[#00A5FF] to-[#3498db] text-black shadow-[0_0_20px_rgba(0,165,255,0.3)] hover:scale-[1.02]"
                                >
                                    {t('payNow')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Coloana dreapta: Sumar comandă */}
                <div className="bg-black border border-[#00A5FF] rounded-sm p-6 md:p-8 h-fit sticky top-28">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6">
                        {t('summary')}
                    </h2>

                    <div className="space-y-4 mb-8">
                        {items.length === 0 ? (
                            <p className="text-white/40">{tCart('empty')}</p>
                        ) : (
                            items.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex justify-between items-start py-4 border-b border-[#00A5FF]/10 gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-[#111] border border-[#00A5FF]/20 flex items-center justify-center p-1 rounded-sm shrink-0 hidden sm:flex">
                                            {item.image ? (
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[#00A5FF] text-xs">IMG</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-white font-bold uppercase text-sm tracking-wide whitespace-normal leading-relaxed">
                                                {item.title}
                                            </p>
                                            <p className="text-white/50 text-xs mt-1">{t('qty')}: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="text-[#00A5FF] font-bold shrink-0 text-right">
                                        £{Number(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-6 border-t border-[#00A5FF]/30 mt-6 mb-6">
                        <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">
                            {t('promoCodeLabel')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoInput}
                                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                                placeholder={t('promoCodePlaceholder')}
                                className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-2 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
                            />
                            <button
                                type="button"
                                onClick={handleApplyPromo}
                                disabled={isApplyingPromo || !promoInput.trim()}
                                className="px-4 py-2 bg-[#00A5FF] text-black font-bold uppercase tracking-wider rounded-sm hover:bg-[#00A5FF]/90 transition-colors disabled:opacity-50"
                            >
                                {isApplyingPromo ? '...' : t('applyPromo')}
                            </button>
                        </div>
                        {promoMessage && (
                            <p className={`mt-2 text-sm ${promoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {promoMessage.text}
                            </p>
                        )}
                        {appliedPromo && (
                            <div className="mt-2 text-sm text-[#00A5FF] bg-[#00A5FF]/10 p-2 rounded-sm border border-[#00A5FF]/20 flex justify-between">
                                <span>{t('promoApplied')} <strong>{appliedPromo.code}</strong></span>
                                <span>-{appliedPromo.discount}%</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-[#00A5FF]/30">
                        <span className="text-white font-bold uppercase tracking-widest">{tCart('total')}</span>
                        <div className="text-right">
                            {appliedPromo && (
                                <div className="text-white/50 line-through text-lg">
                                    £{Number(baseTotal).toFixed(2)}
                                </div>
                            )}
                            <span className="text-3xl font-black text-[#00A5FF]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                £{Number(total).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Badge procesator plăți */}
                    <div className="mt-6 pt-6 border-t border-[#00A5FF]/10">
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1 text-white/30">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs">SSL</span>
                            </div>
                            <div className="text-white/20 text-xs">|</div>
                            <span className="text-white/30 text-xs">PCI DSS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
