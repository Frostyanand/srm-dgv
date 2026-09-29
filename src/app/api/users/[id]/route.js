import { NextResponse } from 'next/server';
import { userService } from '@/services/UserService';
import { authService } from '@/services/AuthService';

function generateSecurePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    // Use adminAuth to verify token directly so we rely on cryptographic claims 
    // rather than potentially delayed or missing database reads
    const { adminAuth } = await import('@/lib/firebase/admin');
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: `Forbidden: Your role is ${decodedToken.role}` }, { status: 403 });
    }

    // Pass the caller ID for validation
    const callerId = decodedToken.uid;

    // Next.js 15+ App Router requires params to be awaited
    const resolvedParams = await params;
    const targetUid = resolvedParams.id;
    
    const body = await request.json();
    const { action, email } = body;

    if (action === 'DEACTIVATE') {
      if (callerId === targetUid) {
        return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
      }
      await userService.deactivateUser(targetUid);
      return NextResponse.json({ success: true });
    }

    if (action === 'RESET_PASSWORD') {
      const newPassword = generateSecurePassword();
      await userService.adminResetPassword(targetUid, newPassword);
      return NextResponse.json({ success: true, tempPassword: newPassword });
    }

    if (action === 'UPDATE_EMAIL') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      await userService.updateUserEmail(targetUid, email);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
