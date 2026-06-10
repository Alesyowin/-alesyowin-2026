import { NextResponse } from 'next/server';
import { fireTikTokEvent, TikTokEventPayload } from '../../../lib/tiktok';
import { getClientIP } from '../../../lib/rate-limit';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Aflăm IP-ul si UserAgent direct din interfața de server din Next.js, ferite de AdBlock
        const ip = getClientIP(request) || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        
        const payload: TikTokEventPayload = {
            event: body.event,
            ip: ip,
            userAgent: userAgent,
            url: body.url || request.headers.get('referer') || 'https://gpcompetition.com',
            properties: body.properties || { contents: [], value: 0, currency: 'GBP' }
        };

        // Tratare izolată -> pasăm în backend cu Fire and Forget (Nu se va bloca clientul din browser)
        fireTikTokEvent(payload);

        return NextResponse.json({ success: true, message: 'Event successfully queued for S2S delivery' });
    } catch (e) {
        // Dacă payloadul trimis din frontend are format greșit, returnăm ok spre log din backend doar - fara a throw erori clientului
        return NextResponse.json({ success: false, error: 'Malformed request' }, { status: 200 });
    }
}
