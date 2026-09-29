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
    
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const user = await userRepository.findById(decodedToken.uid);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: 'MFA not enabled for this user.' }, { status: 400 });
    }

    // Decrypt the secret
    const secret = securityService.decryptPrivateKey(
      user.mfaSecret.encryptedKey,
      user.mfaSecret.iv,
      user.mfaSecret.authTag
    );

    // Verify the code
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authenticator code.' }, { status: 400 });
    }

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
    console.error('MFA Verify Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
