import { NextResponse } from 'next/server';
const { authenticator } = require('otplib');
import { userRepository } from '@/repositories/UserRepository';
import { securityService } from '@/services/SecurityService';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    const { adminAuth } = await import('@/lib/firebase/admin');
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const { secret, code } = await request.json();

    if (!secret || !code) {
      return NextResponse.json({ error: 'Missing secret or code' }, { status: 400 });
    }

    // Verify the code
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authenticator code.' }, { status: 400 });
    }

    // Encrypt the secret
    const encryptedData = securityService.encryptPrivateKey(secret);

    // Save to Firestore
    await userRepository.update(decodedToken.uid, {
      mfaEnabled: true,
      mfaSecret: encryptedData,
    });

    // Set secure HttpOnly cookie for mfa_session
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('mfa_session', decodedToken.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MFA Enable Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
