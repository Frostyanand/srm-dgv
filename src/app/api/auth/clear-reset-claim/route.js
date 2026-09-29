import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // We only clear the requiresPasswordReset claim. We keep the role.
    const currentClaims = decodedToken;
    delete currentClaims.requiresPasswordReset;
    
    // Custom claims shouldn't contain standard JWT fields
    const safeClaims = { role: currentClaims.role };
    
    await adminAuth.setCustomUserClaims(decodedToken.uid, safeClaims);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear reset claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
