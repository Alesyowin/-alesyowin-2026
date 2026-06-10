"use client";

import React, { useRef, useState, useEffect } from 'react';

interface OTPInputProps {
    length: number;
    onComplete: (code: string) => void;
    disabled?: boolean;
}

export default function OTPInput({ length, onComplete, disabled }: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (inputs.current[0]) {
            inputs.current[0].focus();
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (isNaN(Number(val))) return;

        const newOtp = [...otp];
        // Permitem doar ultima cifră introdusă (în caz că browserul face auto-fill sau paste)
        newOtp[index] = val.substring(val.length - 1);
        setOtp(newOtp);

        // Auto-focus pe următorul
        if (val && index < length - 1 && inputs.current[index + 1]) {
            inputs.current[index + 1]?.focus();
        }

        // Verificăm dacă e complet
        const fullCode = newOtp.join("");
        if (fullCode.length === length) {
            onComplete(fullCode);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0 && inputs.current[index - 1]) {
                inputs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text").slice(0, length);
        if (/^\d+$/.test(data)) {
            const newOtp = data.split("").concat(new Array(length - data.length).fill(""));
            setOtp(newOtp);
            if (data.length === length) {
                onComplete(data);
            }
        }
    };

    return (
        <div className="flex gap-2 sm:gap-4 justify-center py-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    disabled={disabled}
                    className="w-10 h-12 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-(--color-black-soft) border border-(--color-gold)/20 rounded text-(--color-gold) focus:border-(--color-gold) focus:ring-1 focus:ring-(--color-gold)/50 outline-none transition-all disabled:opacity-50"
                />
            ))}
        </div>
    );
}
