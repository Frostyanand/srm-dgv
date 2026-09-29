import { NextResponse } from 'next/server';
import { userRepository } from '@/repositories/UserRepository';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    // Bypass strict MFA check here
    const { adminAuth } = await import('@/lib/firebase/admin');
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const user = await userRepository.findById(decodedToken.uid);

    return NextResponse.json({ mfaEnabled: !!(user && user.mfaEnabled) });
  } catch (error) {
    console.error('MFA Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
