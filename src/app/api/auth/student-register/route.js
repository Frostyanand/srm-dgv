import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { securityService } from '@/services/SecurityService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, departmentId, section, year, facultyAdvisorId } = body;

    if (!name || !email || !password || !departmentId) {
      return NextResponse.json({ error: 'Name, email, password, and department are required.' }, { status: 400 });
    }

    // 1. Resolve or find matching Faculty Advisor (FA)
    let assignedFaId = facultyAdvisorId;
    if (!assignedFaId) {
      // Find an FA for this department and section
      const faQuery = await adminDb.collection('users')
        .where('role', '==', 'SIGNATORY')
        .where('departmentId', '==', departmentId)
        .get();

      if (!faQuery.empty) {
        // Try finding matching section
        const sectionMatch = faQuery.docs.find(d => {
          const data = d.data();
          return data.section === section || data.designation?.includes('Faculty Advisor');
        });
        assignedFaId = sectionMatch ? sectionMatch.id : faQuery.docs[0].id;
      }
    }

    // 2. Create or fetch Firebase Auth user
    let uid;
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
      await adminAuth.updateUser(uid, {
        password,
        displayName: name
      });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        const newUser = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        });
        uid = newUser.uid;
      } else {
        throw err;
      }
    }

    // 3. Set Custom Claim for immediate access
    await adminAuth.setCustomUserClaims(uid, {
      role: 'STUDENT',
      requiresPasswordReset: false,
    });

    // 4. Generate ECDSA Keypair
    const { publicKey, privateKey } = securityService.generateECDSAKeyPair();
    const { encryptedKey, iv, authTag } = securityService.encryptPrivateKey(privateKey);

    // 5. Store user record in Firestore
    await adminDb.collection('users').doc(uid).set({
      email,
      name,
      role: 'STUDENT',
      departmentId,
      section: section || 'Section A',
      year: year || '3rd Year',
      facultyAdvisorId: assignedFaId || null,
      status: 'ACTIVE',
      publicKey,
      encryptedPrivateKey: {
        encryptedKey,
        iv,
        authTag
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Student account provisioned successfully',
      userId: uid,
      facultyAdvisorId: assignedFaId
    }, { status: 201 });
  } catch (error) {
    console.error('Student Registration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
