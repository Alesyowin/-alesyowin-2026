/**
 * Sistem simplu de Rate Limiting bazat pe IP.
 * Limitează numărul de cereri pe minut per IP pentru a preveni abuzurile (brute-force, spam).
 * Pe Vercel serverless, memoria nu persistă între invocări diferite,
 * dar protejează contra atacurilor rapide în cadrul aceleiași instanțe.
 */

// Stocăm timestamp-urile cererilor per IP
const requestMap = new Map<string, number[]>();

// Curățăm periodic memoria (la fiecare 5 minute) pentru a nu crește infinit
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minute
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    
    // Ștergem intrările mai vechi de 2 minute
    const cutoff = now - 120000;
    for (const [ip, timestamps] of requestMap.entries()) {
        const recent = timestamps.filter(t => t > cutoff);
        if (recent.length === 0) {
            requestMap.delete(ip);
        } else {
            requestMap.set(ip, recent);
        }
    }
}

/**
 * Verifică dacă un IP a depășit limita de cereri.
 * @param ip - Adresa IP a clientului
 * @param maxRequests - Numărul maxim de cereri permise în intervalul specificat
 * @param windowMs - Intervalul de timp în milisecunde (default: 60 secunde)
 * @returns true dacă cererea este permisă, false dacă limita a fost depășită
 */
export function rateLimit(ip: string, maxRequests: number, windowMs: number = 60000): boolean {
    cleanup();
    
    const now = Date.now();
    const timestamps = requestMap.get(ip) || [];
    
    // Păstrăm doar cererile din fereastra de timp activă
    const recentRequests = timestamps.filter(t => now - t < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        // Limita depășită — blocăm cererea
        return false;
    }
    
    // Adăugăm timestamp-ul curent și salvăm
    recentRequests.push(now);
    requestMap.set(ip, recentRequests);
    
    return true;
}

/**
 * Extrage IP-ul clientului din headerele request-ului.
 * Pe Vercel/Cloudflare, IP-ul real vine prin headere speciale.
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // Primul IP din lista este clientul real
        return forwarded.split(',')[0].trim();
    }
    
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;
    
    // Fallback — nu ar trebui să ajungem aici pe Vercel
    return 'unknown';
}
