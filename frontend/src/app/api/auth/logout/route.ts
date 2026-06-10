import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * Șterge cookie-ul de sesiune pentru delogare completă
 */
export async function POST() {
    try {
        const cookieStore = await cookies();
        
        // Ștergem cookie-ul de sesiune
        cookieStore.delete({
            name: 'customer_token',
            path: '/', // Ne asigurăm că ștergem cookie-ul de la rădăcina site-ului
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API Auth Logout] Eroare la delogare:', error);
        return NextResponse.json({ error: 'Eroare la procesarea cererii de delogare' }, { status: 500 });
    }
}
