"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '../i18n/routing';

interface Customer {
    id: string;
    email: string;
    phone?: string;
    First_Name?: string;
    Last_Name?: string;
}

interface AuthContextType {
    user: Customer | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    requestOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
    verifyOTP: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const locale = useLocale();

    const refreshUser = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('[AuthContext] Refresh user failed:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const requestOTP = async (email: string) => {
        try {
            const response = await fetch('/api/auth/otp/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, locale }),
            });
            const data = await response.json();
            return { success: response.ok, error: data.error };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const verifyOTP = async (email: string, code: string) => {
        try {
            const response = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const data = await response.json();
            
            if (response.ok) {
                setUser(data.user);
                return { success: true };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: 'Verification failed' };
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/');
        } catch (error) {
            console.error('[AuthContext] Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated: !!user, 
            isLoading, 
            requestOTP, 
            verifyOTP, 
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
