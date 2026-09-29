import { NextResponse } from 'next/server';
import { userService } from '@/services/UserService';
import { authService } from '@/services/AuthService';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const user = await authService.verifySession(token);

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'DEPARTMENT_USER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await userService.getAllUsers();
    
    // Sanitize user data
    let safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId,
      status: u.status || 'ACTIVE' 
    }));

    // If Department User, they only need to see active signatories
    if (user.role === 'DEPARTMENT_USER') {
      safeUsers = safeUsers.filter(u => 
        u.status !== 'INACTIVE' && u.role === 'SIGNATORY'
      );
    }

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

function generateSecurePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  // Generate a strong 16 character password
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const currentUser = await authService.verifySession(token);

    if (currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, departmentId } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tempPassword = generateSecurePassword();

    // userService.createUser handles Firebase Auth creation, ECDSA generation, and Firestore
    const newUserId = await userService.createUser({
      name,
      email,
      role,
      departmentId,
      password: tempPassword
    });

    // Set custom claims so the user has their role immediately upon login
    // and force them to change their temporary password
    const { adminAuth } = await import('@/lib/firebase/admin');
    await adminAuth.setCustomUserClaims(newUserId, { 
      role,
      requiresPasswordReset: true 
    });

    return NextResponse.json({ 
      success: true, 
      userId: newUserId,
      tempPassword // Returned exactly once so the Admin can share it
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
