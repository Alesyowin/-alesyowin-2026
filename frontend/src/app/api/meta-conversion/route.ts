import { NextResponse } from 'next/server';
import { sendMetaEvent, MetaEventData } from '../../../lib/metaConversionsApi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extragem datele sigure de pe server (IP-ul real și User-Agent-ul)
    const clientIpAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0';
    const clientUserAgent = request.headers.get('user-agent') || '';
    
    const eventData: MetaEventData = {
      eventName: body.eventName,
      eventId: body.eventId,
      eventTime: body.eventTime,
      eventSourceUrl: body.eventSourceUrl || request.headers.get('referer') || '',
      clientIpAddress,
      clientUserAgent,
      fbp: body.fbp, // Opțional: le poți extrage din cookies în frontend și să le pui în body
      fbc: body.fbc,
      userData: body.userData,
      customData: body.customData,
    };

    const response = await sendMetaEvent(eventData);

    return NextResponse.json({ success: true, metaResponse: response });
  } catch (error: any) {
    console.error('API Meta Conversion Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
