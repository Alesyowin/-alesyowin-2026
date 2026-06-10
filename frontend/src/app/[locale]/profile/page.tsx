"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from '../../../i18n/routing';
import { User, LogOut, Mail, Calendar, Phone, Ticket, ShoppingBag } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function ProfilePage() {
    const t = useTranslations('Profile');
    const locale = useLocale();
    const { user, logout, isLoading: authLoading } = useAuth();
    const [orders, setOrders] = React.useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = React.useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchOrders();
        }
    }, [user, authLoading, router]);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/auth/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('[Profile] Failed to fetch orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const totalTickets = orders.reduce((acc, order) => {
        const tCount = (order.tickets?.length || 0) + (order.ticket?.length || 0);
        return acc + tCount;
    }, 0);

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="w-10 h-10 border-4 border-(--color-gold)/20 border-t-(--color-gold) rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="bg-(--color-black-rich)/80 border border-white/5 rounded-sm p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-(--color-gold) opacity-[0.03] blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />

                <div className="relative z-10 space-y-12">
                    <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/5 pb-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-(--color-gold-dark) to-(--color-gold-light) rounded-full flex items-center justify-center text-4xl font-black text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                            {user.First_Name?.[0] || user.email[0].toUpperCase()}
                            {user.Last_Name?.[0] || ''}
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{t('title')}</h1>
                            <p className="text-white/40 text-sm tracking-widest uppercase font-semibold">{t('memberBadge')}</p>
                        </div>
                        <div className="md:ml-auto">
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-sm transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                <LogOut size={16} />
                                {t('logout')}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                        {/* Informații Personale */}
                        <div className="space-y-6">
                            <h2 className="text-xs uppercase tracking-[0.4em] text-(--color-gold)/60 font-black border-b border-(--color-gold)/20 pb-3 inline-block">{t('personalData')}</h2>
                            
                            <div className="space-y-4">
                                <InfoItem icon={<User size={18} />} label={t('fullName')} value={`${user.First_Name || '-'} ${user.Last_Name || ''}`} />
                                <InfoItem icon={<Mail size={18} />} label={t('email')} value={user.email} />
                                <InfoItem icon={<Phone size={18} />} label={t('phone')} value={user.phone || t('notSet')} />
                            </div>

                            <div className="pt-8">
                                <h2 className="text-xs uppercase tracking-[0.4em] text-(--color-gold)/60 font-black border-b border-(--color-gold)/20 pb-3 inline-block mb-6">{t('ticketsSummary')}</h2>
                                <div className="bg-(--color-black-pure)/50 border border-white/5 p-6 rounded-sm space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/40 uppercase tracking-widest">{t('activeTickets')}</span>
                                        <span className="text-(--color-gold) font-bold">{totalTickets}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-white/40 border-t border-white/5 pt-4">
                                        <span className="uppercase tracking-widest">{t('totalPrizes')}</span>
                                        <span>-</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statistici / Rezumat (Activitate) */}
                        <div className="space-y-6">
                            <h2 className="text-xs uppercase tracking-[0.4em] text-(--color-gold)/60 font-black border-b border-(--color-gold)/20 pb-3 inline-block">{t('recentActivity')}</h2>
                            
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {ordersLoading ? (
                                    <div className="text-center py-10">
                                        <div className="w-6 h-6 border-2 border-(--color-gold)/20 border-t-(--color-gold) rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-white/20 text-xs uppercase tracking-widest">{t('loadingOrders')}</p>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-10 border border-white/5 bg-white/[0.02] rounded-sm">
                                        <ShoppingBag className="mx-auto text-white/10 mb-3" size={32} />
                                        <p className="text-white/20 text-xs uppercase tracking-widest">{t('noOrders')}</p>
                                    </div>
                                ) : (
                                    orders.map((order) => {
                                        const giveawayTitle = order.order_items?.[0]?.Giveaway_ID?.title || 
                                                            order.order_items?.[0]?.giveaway_id?.title || 
                                                            t('event');
                                        const date = new Date(order.date_created).toLocaleDateString(locale, {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        });

                                        return (
                                            <div key={order.id} className="bg-white/[0.03] border border-white/5 p-5 rounded-sm space-y-4 hover:border-(--color-gold)/20 transition-colors group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-white font-bold text-sm uppercase tracking-tight group-hover:text-(--color-gold) transition-colors line-clamp-1">
                                                            {giveawayTitle}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Calendar size={12} className="text-white/20" />
                                                            <span className="text-[10px] text-white/30 uppercase tracking-widest">{date}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-(--color-gold) font-black text-sm">{formatPrice(order.Total_Amount)}</p>
                                                        <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold mt-1">{t('id')}: #{order.id}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Ticket size={12} className="text-(--color-gold)/60" />
                                                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                                            {(order.tickets?.length || 0) + (order.ticket?.length || 0)} {t('ticketsPurchased')}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {[...(order.tickets || []), ...(order.ticket || [])].map((tItem: any, i: number) => (
                                                            <span key={i} className="text-[10px] bg-(--color-gold)/10 text-(--color-gold) px-2 py-0.5 rounded-sm font-mono font-bold">
                                                                #{tItem.ticket_number}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white/5 rounded-sm flex items-center justify-center text-white/40 group-hover:text-(--color-gold) transition-colors border border-white/10 group-hover:border-(--color-gold)/20">
                {icon}
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-widest text-white/20 font-black mb-0.5">{label}</p>
                <p className="text-white font-bold text-sm tracking-wide">{value}</p>
            </div>
        </div>
    );
}
