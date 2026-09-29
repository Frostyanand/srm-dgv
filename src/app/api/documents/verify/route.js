import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { securityService } from '@/services/SecurityService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId') || searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ error: 'Missing docId query parameter' }, { status: 400 });
    }

    const docSnap = await adminDb.collection('documents').doc(docId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ 
        verified: false, 
        message: 'DOCUMENT NOT FOUND. No record matching this identifier exists on the ledger.' 
      }, { status: 404 });
    }

    const docData = docSnap.data();

    // Fetch workflow approvals
    const approvalsSnap = await adminDb.collection('approvals')
      .where('documentId', '==', docId)
      .get();
      
    let signers = [];
    for (const approvalDoc of approvalsSnap.docs) {
      const approval = approvalDoc.data();
      const userSnap = await adminDb.collection('users').doc(approval.approverId).get();
      const user = userSnap.exists ? userSnap.data() : {};
      signers.push({
        name: user.name || 'Official Signatory',
        email: user.email || '',
        role: user.role || 'SIGNATORY',
        designation: user.designation || '',
        action: approval.action,
        timestamp: approval.timestamp,
        signature: approval.signature || '',
      });
    }
    signers.sort((a, b) => a.timestamp - b.timestamp);

    let departmentName = 'School of Computing';
    if (docData.departmentId) {
      const deptSnap = await adminDb.collection('departments').doc(docData.departmentId).get();
      if (deptSnap.exists) departmentName = deptSnap.data().name;
    }

    return NextResponse.json({
      verified: docData.status === 'APPROVED',
      status: docData.status,
      document: {
        id: docId,
        title: docData.title,
        description: docData.description,
        department: departmentName,
        status: docData.status,
        createdAt: docData.createdAt,
      },
      signers,
    });
  } catch (error) {
    console.error('Verify GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const { fileHash } = await request.json();

    if (!fileHash) {
      return NextResponse.json({ error: 'Missing fileHash' }, { status: 400 });
    }

    // Generate the forensic ledger entry using our secure Vercel environment key.
    // If a DB admin tampered with the file and updated the raw hash in the DB,
    // they still could not have updated the secureLedger because they lack this key.
    const ledgerEntry = securityService.generateLedgerEntry(fileHash);

    // Query Firestore for a document that perfectly matches this exact cryptographic ledger signature
    const snapshot = await adminDb.collection('documents')
      .where('secureLedger', '==', ledgerEntry)
      .where('status', '==', 'APPROVED')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ 
        verified: false, 
        message: 'DOCUMENT TAMPERED OR INVALID. Cryptographic signature mismatch.' 
      }, { status: 404 });
    }

    const docData = snapshot.docs[0].data();
    const documentId = snapshot.docs[0].id;

    // Fetch the workflow approvals to get the signers
    const workflowSnap = await adminDb.collection('workflows')
      .where('documentId', '==', documentId)
      .limit(1)
      .get();

    let signers = [];
    if (!workflowSnap.empty) {
      const workflowData = workflowSnap.docs[0].data();
      const approvalsSnap = await adminDb.collection('approvals')
        .where('documentId', '==', documentId)
        .get();
        
      // Fetch user details for each approval
      const approvals = approvalsSnap.docs.map(d => d.data());
      for (const approval of approvals) {
        const userSnap = await adminDb.collection('users').doc(approval.approverId).get();
        if (userSnap.exists) {
          const user = userSnap.data();
          signers.push({
            name: user.name,
            email: user.email,
            role: user.role,
            action: approval.action,
            timestamp: approval.timestamp,
            signature: approval.signature, // Cryptographic ECDSA signature
          });
        }
      }
      
      // Sort signers chronologically
      signers.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Fetch department details
    let departmentName = 'Unknown';
    if (docData.departmentId) {
      const deptSnap = await adminDb.collection('departments').doc(docData.departmentId).get();
      if (deptSnap.exists) {
        departmentName = deptSnap.data().name;
      }
    }

    return NextResponse.json({
      verified: true,
      document: {
        id: documentId,
        title: docData.title,
        description: docData.description,
        department: departmentName,
      },
      signers,
    });
  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
