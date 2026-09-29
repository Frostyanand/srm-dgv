import { NextResponse } from 'next/server';
import { authService } from '@/services/AuthService';
const { authenticator } = require('otplib');
import qrcode from 'qrcode';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    // We intentionally bypass strict MFA enforcement here because this route
    // is specifically for users who need to set it up (or reset it).
    // So we use adminAuth to just decode the token safely.
    const { adminAuth } = await import('@/lib/firebase/admin');
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const userEmail = decodedToken.email;
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(userEmail, 'SRM Digital Verification', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({ secret, qrCodeUrl });
  } catch (error) {
    console.error('MFA Setup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
