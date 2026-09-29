import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { securityService } from '@/services/SecurityService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, section, year, facultyAdvisorId } = body;
    const targetDeptId = body.departmentId || body.department;

    if (!name || !email || !password || !targetDeptId) {
      return NextResponse.json({ error: 'Name, email, password, and department are required.' }, { status: 400 });
    }

    // 1. Resolve or find matching Faculty Advisor (FA)
    let assignedFaId = facultyAdvisorId;
    let assignedFaName = 'Faculty Advisor';
    if (!assignedFaId) {
      const faQuery = await adminDb.collection('users')
        .where('role', '==', 'SIGNATORY')
        .get();

      if (!faQuery.empty) {
        const matchingFas = faQuery.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => {
            const matchesDept = (u.departmentId === targetDeptId || u.department === targetDeptId || u.email?.includes(targetDeptId.toLowerCase()));
            return matchesDept && (u.designation?.includes('Faculty Advisor') || u.section === section);
          });
        
        const chosenFa = matchingFas.length > 0 ? matchingFas[0] : faQuery.docs[0];
        assignedFaId = chosenFa.id;
        assignedFaName = chosenFa.name || 'Faculty Advisor';
      }
    } else {
      const faDoc = await adminDb.collection('users').doc(assignedFaId).get();
      if (faDoc.exists) assignedFaName = faDoc.data().name || 'Faculty Advisor';
    }

    // 2. Check if student email is already registered
    let uid;
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json({ 
          error: 'An account with this institutional email address already exists. Please log in.' 
        }, { status: 409 });
      }
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
      departmentId: targetDeptId,
      department: targetDeptId,
      section: section || 'Section A',
      year: year || '3rd Year',
      facultyAdvisorId: assignedFaId || null,
      facultyAdvisorName: assignedFaName,
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
      facultyAdvisorId: assignedFaId,
      facultyAdvisorName: assignedFaName
    }, { status: 201 });
  } catch (error) {
    console.error('Student Registration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
