"use client";

import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from '../../../i18n/routing';
import { useTranslations } from 'next-intl';
import OTPInput from '../../../components/auth/OTPInput';
import { Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isPending, setIsPending] = useState(false);
    
    const { requestOTP, verifyOTP } = useAuth();
    const router = useRouter();
    const t = useTranslations('Navbar'); // Folosim 'Navbar' pentru login momentan sau creăm secțiune nouă

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsPending(true);

        const { success, error: apiError } = await requestOTP(email);
        
        setIsPending(false);
        if (success) {
            setStep('otp');
        } else {
            setError(apiError || 'Eroare la trimiterea codului. Încearcă din nou.');
        }
    };

    const handleVerifyOTP = async (code: string) => {
        setError('');
        setIsPending(true);

        const { success, error: apiError } = await verifyOTP(email, code);
        
        if (success) {
            router.push('/profile');
        } else {
            setIsPending(false);
            setError(apiError || 'Codul introdus este incorect sau a fost deja utilizat.');
        }
    };

    return (
        <div className="flex justify-center items-center py-20 px-4">
            <div className="w-full max-w-md bg-(--color-black-rich)/80 backdrop-blur-xl border border-(--color-gold)/10 p-8 rounded-sm shadow-2xl relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-(--color-gold) opacity-[0.05] blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-(--color-gold) opacity-[0.03] blur-3xl translate-y-1/2 -translate-x-1/2 rounded-full" />

                <div className="relative z-10 text-center space-y-6">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                        {step === 'email' ? 'Autentificare' : 'Verificare Cod'}
                    </h1>
                    <p className="text-white/50 text-sm">
                        {step === 'email' 
                            ? 'Introdu adresa de email pentru a primi codul de acces.' 
                            : `Am trimis un cod de 6 cifre pe adresa ${email}`
                        }
                    </p>

                    {step === 'email' ? (
                        <form onSubmit={handleRequestOTP} className="space-y-4 pt-4">
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-(--color-gold) transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    placeholder="Nume.prenume@exemplu.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-(--color-black-soft) border border-white/10 rounded py-3 pl-10 pr-4 text-white focus:border-(--color-gold) focus:ring-1 focus:ring-(--color-gold)/20 outline-none transition-all placeholder:text-white/20"
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs font-medium bg-red-400/10 py-2 rounded-sm border border-red-400/20 px-3">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-gradient-to-r from-(--color-gold-dark) via-(--color-gold) to-(--color-gold-light) text-black font-black uppercase tracking-widest py-4 rounded-sm hover:scale-[1.02] transition-all transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                                {isPending ? <Loader2 className="animate-spin" /> : 'Trimite Cod Acces'}
                                {!isPending && <ArrowRight size={18} />}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <OTPInput 
                                length={6} 
                                onComplete={handleVerifyOTP} 
                                disabled={isPending}
                            />
                            
                            {error && (
                                <p className="text-red-400 text-xs font-medium bg-red-400/10 py-2 rounded-sm border border-red-400/20 px-3">
                                    {error}
                                </p>
                            )}

                            <button 
                                onClick={() => setStep('email')}
                                className="text-white/30 hover:text-white text-xs uppercase tracking-widest font-semibold transition-colors"
                            >
                                Schimbă Adresa de Email
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
