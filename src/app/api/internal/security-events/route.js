import { NextResponse } from 'next/server';
import { securityEventService } from '@/services/SecurityEventService';

export async function POST(request) {
  try {
    const internalKey = request.headers.get('x-internal-api-key');
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized internal call' }, { status: 401 });
    }

    const { eventType, details, requestInfo } = await request.json();
    
    await securityEventService.logSecurityEvent(eventType, details, requestInfo);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
