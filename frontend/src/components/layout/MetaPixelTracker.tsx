"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function MetaPixelTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Trimite evenimentul la montare și la fiecare schimbare de rută
        fetch('/api/meta-conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: 'PageView',
                eventSourceUrl: window.location.href,
                eventId: crypto.randomUUID()
            })
        }).catch(err => console.error("Eroare trimitere PageView:", err));
    }, [pathname, searchParams]);

    return null; // Component invizibil
}
