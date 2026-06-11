"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '../../../contexts/AuthContext';
import { useCartStore } from '../../../lib/store';
import { useState, useEffect, useRef } from 'react';

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    
    // Protecție suplimentară contra dublu-click
    const isProcessingRef = useRef(false);

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

    const total = getTotal();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /**
     * Fluxul complet de checkout (Hosted Payment Page):
     * 1. Creăm comanda în Directus (status: pending)
     * 2. Dacă e gratuit (£0) → mock-payment
     * 3. Dacă e plătit → cerăm semnătura de la server → construim formular ascuns → auto-submit către Paytriot
     */
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        // Protecție contra dublu-click la nivel de JS (suplimentar față de disabled pe buton)
        if (isProcessingRef.current) {
            console.warn('[Checkout] Plata este deja în curs. Ignorăm click-ul dublu.');
            return;
        }
        isProcessingRef.current = true;
        setIsSubmitting(true);
        setPaymentError(null);

        // Generare Event ID comun pentru dedublare Meta
        const initiateCheckoutEventId = crypto.randomUUID();

        // META CAPI: InitiateCheckout — cu Advanced Matching (date client)
        fetch('/api/meta-conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: 'InitiateCheckout',
                eventId: initiateCheckoutEventId,
                eventSourceUrl: window.location.href,
                // Date client pentru Advanced Matching (SDK-ul le hashează automat SHA-256 pe server)
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

        // TIKTOK S2S: InitiateCheckout (Fire and forget from client)
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
        }).catch(() => null); // Ignorăm orice failing ca să nu oprim clientul

        try {
            // Verificăm dacă selecția respectă limita minimă pentru fiecare produs în parte
            const invalidItem = items.find(item => item.minTickets && item.quantity < item.minTickets);
            if (invalidItem) {
                setPaymentError(`You must select at least ${invalidItem.minTickets} tickets for ${invalidItem.title}. Please go back to the cart and update the quantity.`);
                setIsSubmitting(false);
                return;
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
                    throw new Error('Procesarea comenzii gratuite a eșuat');
                }
                
                console.log(`[Checkout] Bilet gratuit generat pentru Order: ${data.orderId}`);
                
                // Salvăm obiect complet în sessionStorage pentru evenimentul Purchase pe pagina de success
                const purchaseEventId = crypto.randomUUID();
                sessionStorage.setItem('pendingPurchaseData', JSON.stringify({
                    total: total,
                    currency: 'GBP',
                    eventId: purchaseEventId,
                    userData: {
                        email: formData.email,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        city: formData.city,
                        zip: formData.postal_code,
                        country: formData.country,
                    },
                    contentIds: items.map(i => i.id),
                    orderId: data.orderId
                }));
                
                clearCart();
                await refreshUser();
                window.location.href = `/${locale}/success?orderId=${data.orderId}`;
                return;
            }

            // --- PASUL 2: Obținem câmpurile semnate de la server pentru Hosted Payment Page ---
            // Includem tokenul secret generat la crearea comenzii pentru a valida callback-ul
            const redirectURL = `${window.location.origin}/api/payment-callback?orderId=${data.orderId}&locale=${locale}&sec=${data.cbSecret}`;

            console.log(`[Checkout] Cerăm semnătura pentru Hosted Payment Page...`);

            const formResponse = await fetch('/api/payment-form-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: data.orderId,
                    amount: total,
                    redirectURL: redirectURL,
                    // Date client pentru pre-completarea paginii de plată Paytriot
                    customerName: `${formData.firstName} ${formData.lastName}`.trim(),
                    customerEmail: formData.email,
                    customerPhone: formData.phone,
                    customerAddress: formData.address,
                    customerPostcode: formData.postal_code,
                    // Țara clientului — folosită pentru conversia telefonului în format internațional
                    customerCountry: formData.country,
                }),
            });

            const formResult = await formResponse.json();

            if (!formResponse.ok) {
                throw new Error(formResult.error || 'Failed to prepare payment');
            }

            console.log(`[Checkout] Semnătură primită, redirectăm către Paytriot...`);

            // --- PASUL 3: Construim formularul HTML ascuns și îl trimitem automat ---
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'https://gateway.paytriot.co.uk/paymentform/';
            form.style.display = 'none';

            // Adăugăm fiecare câmp ca input hidden
            for (const [key, value] of Object.entries(formResult.fields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value as string;
                form.appendChild(input);
            }

            document.body.appendChild(form);

            // Salvăm obiect complet în sessionStorage pentru evenimentul Purchase pe pagina de success
            const purchaseEventId = crypto.randomUUID();
            sessionStorage.setItem('pendingPurchaseData', JSON.stringify({
                total: total,
                currency: 'GBP',
                eventId: purchaseEventId,
                userData: {
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    city: formData.city,
                    zip: formData.postal_code,
                    country: formData.country,
                },
                contentIds: items.map(i => i.id),
                orderId: data.orderId
            }));

            // Golăm coșul înainte de redirect (utilizatorul părăsește pagina)
            clearCart();

            // Auto-submit — utilizatorul este redirectat către pagina securizată Paytriot
            form.submit();
            return;

        } catch (error: any) {
            console.error('Eroare checkout:', error);
            setPaymentError(error.message || t('errorProcessing'));
        } finally {
            setIsSubmitting(false);
            isProcessingRef.current = false;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 font-sans relative">
            <h1
                className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest mb-12"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
                {t('title')}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Coloana stânga: Formular date client */}
                <div className="bg-[#0A0A0A] border border-[#00A5FF]/20 rounded-sm p-6 md:p-8">
                    <h2 className="text-xl font-bold text-[#00A5FF] uppercase tracking-widest mb-6">
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
                                        <input
                                            required
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            className="w-full bg-[#111] border border-[#00A5FF]/30 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#00A5FF] focus:ring-1 focus:ring-[#00A5FF] transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secțiunea de plată — redirect către Paytriot Hosted Payment Page */}
                        {total > 0 && (
                            <div className="pt-6 border-t border-[#00A5FF]/20 mt-2">
                                <h3 className="text-lg font-bold text-[#00A5FF] uppercase tracking-widest mb-4">
                                    💳 {t('paymentTitle') || 'Payment Details'}
                                </h3>
                                <div className="bg-[#111] border border-[#00A5FF]/20 rounded-sm p-5 flex items-center gap-4">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-[#00A5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm">
                                            {t('secureRedirect') || 'You will be securely redirected to our payment provider to complete your purchase.'}
                                        </p>
                                        <p className="text-white/40 text-xs mt-1">
                                            Powered by Paytriot · 256-bit SSL Encryption
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mesaj de eroare plată */}
                        {paymentError && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-sm px-4 py-3 text-red-400 text-sm">
                                ⚠️ {paymentError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || items.length === 0 || items.some(i => i.minTickets && i.quantity < i.minTickets)}
                            className={`
                                w-full py-4 px-8 rounded-sm font-black uppercase tracking-[0.3em] text-sm
                                transition-all duration-300 mt-8
                                ${isSubmitting || items.length === 0 || items.some(i => i.minTickets && i.quantity < i.minTickets)
                                    ? 'bg-[#222] text-white/30 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#008ecc] via-[#00A5FF] to-[#3498db] text-black shadow-[0_0_20px_rgba(0,165,255,0.3)] hover:scale-[1.02]'
                                }
                            `}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('processing')}
                                </span>
                            ) : (t('payNow'))}
                        </button>
                    </form>
                </div>

                {/* Coloana dreapta: Sumar comandă */}
                <div className="bg-[#0A0A0A] border border-[#00A5FF]/20 rounded-sm p-6 md:p-8 h-fit sticky top-28">
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

                    <div className="flex justify-between items-center pt-4 border-t border-[#00A5FF]/30">
                        <span className="text-white font-bold uppercase tracking-widest">{tCart('total')}</span>
                        <span className="text-3xl font-black text-[#00A5FF]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            £{Number(total).toFixed(2)}
                        </span>
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
                            <div className="text-white/20 text-xs">|</div>
                            <span className="text-white/30 text-xs">Paytriot</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
