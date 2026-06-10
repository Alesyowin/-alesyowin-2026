import { NextResponse } from 'next/server';

// Proxy pentru assets Directus — evită expunerea token-ului în browser
// Fișierele Directus sunt protejate (403) și necesită autentificare

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://gpcompetition.onrender.com';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN!;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id || !ADMIN_TOKEN) {
        return NextResponse.json({ error: 'Missing file ID or token not configured' }, { status: 400 });
    }

    try {
        // Preluăm parametrii de transformare
        const { searchParams } = new URL(request.url);
        const width = searchParams.get('width');
        const height = searchParams.get('height');
        const explicitQuality = searchParams.get('quality');
        const explicitFormat = searchParams.get('format');
        
        // Construim URL-ul final cu transformări pentru Directus ( Sharp sub capotă )
        const queryParams = new URLSearchParams();
        
        // Dacă am primit parametri expliciti (width, height, etc), abia atunci aplicăm defaults-urile de optimizare
        if (width || height || explicitQuality || explicitFormat) {
            if (width) queryParams.set('width', width);
            if (height) queryParams.set('height', height);
            queryParams.set('quality', explicitQuality || '85');
            queryParams.set('format', explicitFormat || 'webp');
        }

        const queryString = queryParams.toString();
        const assetUrl = queryString 
            ? `${DIRECTUS_URL}/assets/${id}?${queryString}`
            : `${DIRECTUS_URL}/assets/${id}`; // Fișierul pur, original, 0 procesare server
        
        console.log(`[asset-proxy] Fetching image: ${id} (${width || 'original'}px)`);

        const response = await fetch(assetUrl, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        });

        if (!response.ok) {
            console.error(`[asset-proxy] Error ${response.status} for asset ${id}`);
            return NextResponse.json(
                { error: `Asset not available: ${response.status}` },
                { status: response.status }
            );
        }

        // Preluăm body-ul și content-type-ul corectat (Directus returnează WebP dacă am cerut WebP)
        const contentType = response.headers.get('content-type') || 'image/webp';
        const imageBuffer = await response.arrayBuffer();

        // Returnăm imaginea cu cache agresiv de 7 zile (fișierele nu se schimbă des)
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
            },
        });
    } catch (error: any) {
        console.error('[asset-proxy] Error in asset proxy:', error?.message);
        return NextResponse.json({ error: 'Error in asset proxy' }, { status: 500 });
    }
}
