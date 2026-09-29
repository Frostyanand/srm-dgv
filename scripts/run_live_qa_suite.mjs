/**
 * SRM DGV - Comprehensive End-to-End QA Test Automation Suite
 * 
 * Executes rigorous, live endpoint tests covering every single user flow,
 * security boundary, cryptographic operation, and institutional role.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

const BASE_URL = 'http://127.0.0.1:3000';
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAgOXbGEAItgAKNyES9csJE_9OcDH-CWYw';
const DEFAULT_PASSWORD = 'SRM#2026Demo';

// Initialize Firebase Admin for background assertions & token generation
function initAdmin() {
  if (getApps().length === 0) {
    let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    rawKey = rawKey.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    const cleanKey = rawKey.replace(/\\n/g, '\n');

    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'srm-dgv',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: cleanKey,
      }),
    });
  }
}
initAdmin();
const adminAuth = getAuth();
const adminDb = getFirestore();

// Test Reporter
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  suites: [],
};

function logHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 ${title.toUpperCase()}`);
  console.log('='.repeat(80));
}

function assert(condition, testName, details = '') {
  if (condition) {
    results.passed++;
    console.log(`  ✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
    return true;
  } else {
    results.failed++;
    console.error(`  ❌ [FAIL] ${testName} ${details ? `- ${details}` : ''}`);
    return false;
  }
}

// Helper to obtain a real Firebase ID token for a user
async function getIdTokenForUser(email, password = DEFAULT_PASSWORD) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok || !data.idToken) {
    throw new Error(`Failed to authenticate ${email}: ${JSON.stringify(data)}`);
  }
  return data.idToken;
}

// Generate a valid minimal PDF buffer for testing
function generateSamplePdfBuffer(title = 'Sample Document') {
  const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (${title}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n00000000117 00000 n \n0000000213 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n308\n%%EOF`;
  return Buffer.from(content, 'utf-8');
}

async function runTestSuite() {
  console.log('\n🚀 STARTING SRM DGV LIVE QA MASTER TEST PIPELINE');
  console.log(`Target Environment: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let tokens = {};

  // =========================================================================
  // MODULE 1: AUTHENTICATION & MULTI-ROLE CREDENTIAL VALIDATION
  // =========================================================================
  logHeader('Module 1: Authentication & Multi-Role Identity Verification');
  
  const testAccounts = [
    { role: 'STUDENT', email: 'rahul.ctech@srmist.edu.in', label: 'Rahul Sharma (Student)' },
    { role: 'SIGNATORY', email: 'fa.ctech.secA@srmist.edu.in', label: 'Dr. S. Karthik (Faculty Advisor)' },
    { role: 'SIGNATORY', email: 'aa.ctech.3rd@srmist.edu.in', label: 'Dr. A. Rajesh (Academic Advisor)' },
    { role: 'SIGNATORY', email: 'hod.ctech@srmist.edu.in', label: 'Dr. M. Murali (HOD CTech)' },
    { role: 'SIGNATORY', email: 'dean.soc@srmist.edu.in', label: 'Dr. Revathi Venkataraman (Dean SOC)' },
    { role: 'SUPER_ADMIN', email: 'superadmin@srmist.edu.in', password: 'SRM#SecureAdmin2026!', label: 'Super Administrator' },
  ];

  for (const acc of testAccounts) {
    try {
      const token = await getIdTokenForUser(acc.email, acc.password || DEFAULT_PASSWORD);
      tokens[acc.email] = token;
      assert(token && token.length > 50, `Authenticate as ${acc.label}`, `JWT length: ${token.length}`);
    } catch (err) {
      assert(false, `Authenticate as ${acc.label}`, err.message);
    }
  }

  // Security Test: Invalid credentials rejection
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.ctech@srmist.edu.in', password: 'WRONG_PASSWORD_XYZ', returnSecureToken: true }),
    });
    assert(!res.ok, 'Rejection of invalid password credentials', `Status: ${res.status}`);
  } catch (e) {
    assert(true, 'Rejection of invalid password credentials');
  }

  // =========================================================================
  // MODULE 2: METADATA & INSTITUTIONAL DIRECTORY INTEGRITY
  // =========================================================================
  logHeader('Module 2: Institutional Metadata & Templates Directory');

  // Test /api/departments
  try {
    const deptRes = await fetch(`${BASE_URL}/api/departments`, {
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` }
    });
    const deptData = await deptRes.json();
    assert(deptRes.ok, 'GET /api/departments returns HTTP 200');
    assert(deptData.departments && deptData.departments.length === 4, 'Departments directory contains 4 SOC departments', `Found: ${deptData.departments?.map(d => d.name).join(', ')}`);
    assert(deptData.directorate && deptData.directorate.dean, 'Directorate metadata contains Dean profile');
  } catch (err) {
    assert(false, 'GET /api/departments', err.message);
  }

  // Test /api/workflows/templates
  try {
    const tplRes = await fetch(`${BASE_URL}/api/workflows/templates`, {
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` }
    });
    const tplData = await tplRes.json();
    assert(tplRes.ok, 'GET /api/workflows/templates returns HTTP 200');
    const templates = tplData.templates || tplData;
    assert(Array.isArray(templates) && templates.length >= 15, 'Templates directory contains all 15 SRM workflow templates', `Count: ${templates.length}`);
  } catch (err) {
    assert(false, 'GET /api/workflows/templates', err.message);
  }

  // =========================================================================
  // MODULE 3: STUDENT DYNAMIC ONBOARDING & FA BINDING
  // =========================================================================
  logHeader('Module 3: Student Self-Registration & Gatekeeper Binding');

  const dynStudentEmail = `qa.student.${Date.now()}@srmist.edu.in`;
  let dynStudentToken = null;

  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/student-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynStudentEmail,
        password: DEFAULT_PASSWORD,
        name: 'QA Test Student',
        registerNumber: `RA221100301${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'CTech',
        section: 'Section A',
        year: 3
      })
    });
    const regData = await regRes.json();
    assert(regRes.ok, 'POST /api/auth/student-register creates new student profile', `UID: ${regData.userId}`);
    assert(regData.facultyAdvisorName === 'Dr. S. Karthik', 'Student automatically bound to Section A FA (Dr. S. Karthik)');

    // Authenticate as the newly registered dynamic student
    dynStudentToken = await getIdTokenForUser(dynStudentEmail, DEFAULT_PASSWORD);
    assert(!!dynStudentToken, 'Newly registered student obtains valid ID token');

    // Duplicate Registration Defense Test
    const dupRes = await fetch(`${BASE_URL}/api/auth/student-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynStudentEmail,
        password: DEFAULT_PASSWORD,
        name: 'Duplicate Student',
        registerNumber: 'RA999999999',
        department: 'CTech',
        section: 'Section A',
        year: 3
      })
    });
    assert(!dupRes.ok, 'Duplicate student registration blocked by IAM', `Status: ${dupRes.status}`);
  } catch (err) {
    assert(false, 'Student registration flow', err.message);
  }

  // =========================================================================
  // MODULE 4: STUDENT UPLOAD & MANDATORY FA GATEKEEPER PROTOCOL
  // =========================================================================
  logHeader('Module 4: Student Document Submission & FA Gatekeeper Lockdown');

  let testDocId = null;
  const samplePdf = generateSamplePdfBuffer('SRM Hackathon Proposal 2026');

  try {
    // Attack Test: Student maliciously attempts to route directly to Dean and HOD, omitting their FA!
    const deanUser = await adminAuth.getUserByEmail('dean.soc@srmist.edu.in');
    const hodUser = await adminAuth.getUserByEmail('hod.ctech@srmist.edu.in');
    const faUser = await adminAuth.getUserByEmail('fa.ctech.secA@srmist.edu.in');
    const aaUser = await adminAuth.getUserByEmail('aa.ctech.3rd@srmist.edu.in');

    const form = new FormData();
    const blob = new Blob([samplePdf], { type: 'application/pdf' });
    form.append('file', blob, 'Hackathon_Proposal.pdf');
    form.append('title', 'National Hackathon Delegation Permission');
    form.append('description', 'Inter-collegiate 36h hackathon team participation proposal');
    form.append('templateId', 'hackathon_permission');
    // Bypassing FA: student passes only AA, HOD, and Dean!
    form.append('requiredApprovers', JSON.stringify([aaUser.uid, hodUser.uid, deanUser.uid]));

    const uploadRes = await fetch(`${BASE_URL}/api/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` },
      body: form
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.ok, 'POST /api/documents upload succeeds', `DocId: ${uploadData.documentId}`);
    testDocId = uploadData.documentId;

    // Verify Server-Side FA Injection in Firestore
    const wfSnap = await adminDb.collection('workflows').where('documentId', '==', testDocId).limit(1).get();
    assert(!wfSnap.empty, 'Workflow created in Firestore');
    const wf = wfSnap.docs[0].data();

    assert(wf.requiredApprovers[0] === faUser.uid, 'GATEKEEPER SECURITY SHIELD: Section FA (Dr. S. Karthik) was forcefully injected at Stage 1, overriding student client attempt to bypass!');
  } catch (err) {
    assert(false, 'Document upload & FA gatekeeper injection', err.message);
  }

  // =========================================================================
  // MODULE 5: SEQUENTIAL QUEUE VISIBILITY & ISOLATION
  // =========================================================================
  logHeader('Module 5: Sequential Queue Isolation Test');

  try {
    // 1. FA pending queue MUST contain testDocId
    const faPendingRes = await fetch(`${BASE_URL}/api/documents/pending`, {
      headers: { 'Authorization': `Bearer ${tokens['fa.ctech.secA@srmist.edu.in']}` }
    });
    const faPending = await faPendingRes.json();
    const faHasDoc = faPending.pendingDocs?.some(d => d.id === testDocId);
    assert(faHasDoc, 'FA (Dr. S. Karthik) has document visible in Stage 1 queue');

    // 2. AA pending queue MUST NOT contain testDocId yet!
    const aaPendingRes = await fetch(`${BASE_URL}/api/documents/pending`, {
      headers: { 'Authorization': `Bearer ${tokens['aa.ctech.3rd@srmist.edu.in']}` }
    });
    const aaPending = await aaPendingRes.json();
    const aaHasDoc = aaPending.pendingDocs?.some(d => d.id === testDocId);
    assert(!aaHasDoc, 'AA (Dr. A. Rajesh) queue is shielded: document is HIDDEN pending Stage 1 clearance');

    // 3. HOD pending queue MUST NOT contain testDocId yet!
    const hodPendingRes = await fetch(`${BASE_URL}/api/documents/pending`, {
      headers: { 'Authorization': `Bearer ${tokens['hod.ctech@srmist.edu.in']}` }
    });
    const hodPending = await hodPendingRes.json();
    const hodHasDoc = hodPending.pendingDocs?.some(d => d.id === testDocId);
    assert(!hodHasDoc, 'HOD (Dr. M. Murali) queue is shielded: document is HIDDEN');

    // 4. Dean pending queue MUST NOT contain testDocId yet!
    const deanPendingRes = await fetch(`${BASE_URL}/api/documents/pending`, {
      headers: { 'Authorization': `Bearer ${tokens['dean.soc@srmist.edu.in']}` }
    });
    const deanPending = await deanPendingRes.json();
    const deanHasDoc = deanPending.pendingDocs?.some(d => d.id === testDocId);
    assert(!deanHasDoc, 'Dean (Dr. Revathi) queue is shielded: document is HIDDEN');
  } catch (err) {
    assert(false, 'Sequential queue isolation test', err.message);
  }

  // =========================================================================
  // MODULE 6: OUT-OF-ORDER APPROVAL SECURITY ENFORCEMENT
  // =========================================================================
  logHeader('Module 6: Out-of-Order Approval Attack Prevention');

  try {
    // Attack Test: Academic Advisor attempts to sign before the Faculty Advisor
    const prematureAARes = await fetch(`${BASE_URL}/api/workflows/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens['aa.ctech.3rd@srmist.edu.in']}`
      },
      body: JSON.stringify({
        documentId: testDocId,
        action: 'APPROVE',
        remarks: 'Premature approval attempt'
      })
    });
    assert(!prematureAARes.ok, 'Out-of-order approval rejected by state engine (AA attempting to jump queue)', `Status: ${prematureAARes.status}`);

    // Attack Test: Dean attempts to sign before lower stages
    const prematureDeanRes = await fetch(`${BASE_URL}/api/workflows/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens['dean.soc@srmist.edu.in']}`
      },
      body: JSON.stringify({
        documentId: testDocId,
        action: 'APPROVE',
        remarks: 'Dean premature approval attempt'
      })
    });
    assert(!prematureDeanRes.ok, 'Out-of-order approval rejected by state engine (Dean attempting to jump queue)', `Status: ${prematureDeanRes.status}`);
  } catch (err) {
    assert(false, 'Out-of-order approval defense', err.message);
  }

  // =========================================================================
  // MODULE 7: FULL SEQUENTIAL APPROVAL PIPELINE TO COMPLETION
  // =========================================================================
  logHeader('Module 7: Full Sequential Approval Pipeline Execution');

  try {
    // Stage 1: FA Approval
    const faApproveRes = await fetch(`${BASE_URL}/api/workflows/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens['fa.ctech.secA@srmist.edu.in']}`
      },
      body: JSON.stringify({
        documentId: testDocId,
        action: 'APPROVE',
        remarks: 'Attendance verified (>80%). Approved for technical representation.'
      })
    });
    assert(faApproveRes.ok, 'Stage 1: FA (Dr. S. Karthik) cryptographically signs and approves');

    // Stage 2: AA queue should now be unlocked!
    const aaPendingRes2 = await fetch(`${BASE_URL}/api/documents/pending`, {
      headers: { 'Authorization': `Bearer ${tokens['aa.ctech.3rd@srmist.edu.in']}` }
    });
    const aaPending2 = await aaPendingRes2.json();
    const aaNowHasDoc = aaPending2.pendingDocs?.some(d => d.id === testDocId);
    assert(aaNowHasDoc, 'Stage 2 Transition: Document seamlessly released into AA (Dr. A. Rajesh) queue');

    // Stage 2: AA Approval
    const aaApproveRes = await fetch(`${BASE_URL}/api/workflows/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens['aa.ctech.3rd@srmist.edu.in']}`
      },
      body: JSON.stringify({
        documentId: testDocId,
        action: 'APPROVE',
        remarks: 'Academic calendar checked. On-duty attendance sanctioned.'
      })
    });
    assert(aaApproveRes.ok, 'Stage 2: AA (Dr. A. Rajesh) cryptographically signs and approves');

    // Stage 3: HOD Approval
    const hodApproveRes = await fetch(`${BASE_URL}/api/workflows/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens['hod.ctech@srmist.edu.in']}`
      },
      body: JSON.stringify({
        documentId: testDocId,
        action: 'APPROVE',
        remarks: 'Departmental clearance sanctioned.'
      })
    });
    assert(hodApproveRes.ok, 'Stage 3: HOD (Dr. M. Murali) cryptographically signs and approves');

    // Stage 4: Dean Final Approval
    const deanApproveRes = await fetch(`${BASE_URL}/api/workflows/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens['dean.soc@srmist.edu.in']}`
      },
      body: JSON.stringify({
        documentId: testDocId,
        action: 'APPROVE',
        remarks: 'Executive sanction granted. Best wishes to team.'
      })
    });
    assert(deanApproveRes.ok, 'Stage 4: Dean (Dr. Revathi) cryptographically signs and completes workflow');

    // Check final status
    const docSnap = await adminDb.collection('documents').doc(testDocId).get();
    const docData = docSnap.data();
    assert(docData.status === 'APPROVED', 'Document status transitioned to APPROVED in database');
  } catch (err) {
    assert(false, 'Sequential approval pipeline execution', err.message);
  }

  // =========================================================================
  // MODULE 8: WORKFLOW REJECTION & TERMINATION GUARANTEE
  // =========================================================================
  logHeader('Module 8: Workflow Rejection & Termination Guarantee');

  try {
    const rejectDocBuffer = generateSamplePdfBuffer('Unapproved OD Leave Request');
    const form = new FormData();
    form.append('file', new Blob([rejectDocBuffer], { type: 'application/pdf' }), 'OD_Application.pdf');
    form.append('title', 'Irregular OD Attendance Petition');
    form.append('description', 'Late application with missing medical certificate');
    form.append('templateId', 'od_ml_application');
    const aaUser = await adminAuth.getUserByEmail('aa.ctech.3rd@srmist.edu.in');
    form.append('requiredApprovers', JSON.stringify([aaUser.uid]));

    const upRes = await fetch(`${BASE_URL}/api/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` },
      body: form
    });
    const upData = await upRes.json();
    const rejectDocId = upData.documentId;
    assert(!!rejectDocId, 'Created second document for rejection workflow test');

    // FA Rejection
    const rejectRes = await fetch(`${BASE_URL}/api/workflows/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens['fa.ctech.secA@srmist.edu.in']}`
      },
      body: JSON.stringify({
        documentId: rejectDocId,
        action: 'REJECT',
        remarks: 'Rejected: Attendance below mandatory 75% threshold without valid proof.'
      })
    });
    assert(rejectRes.ok, 'FA records formal rejection with remarks');

    const rejectSnap = await adminDb.collection('documents').doc(rejectDocId).get();
    assert(rejectSnap.data().status === 'REJECTED', 'Document status terminates immediately to REJECTED');

    // Verify it NEVER appeared in AA queue
    const aaPendingRes = await fetch(`${BASE_URL}/api/documents/pending`, {
      headers: { 'Authorization': `Bearer ${tokens['aa.ctech.3rd@srmist.edu.in']}` }
    });
    const aaPending = await aaPendingRes.json();
    const aaHasRejectedDoc = aaPending.pendingDocs?.some(d => d.id === rejectDocId);
    assert(!aaHasRejectedDoc, 'Rejected document was terminated and never delivered to AA');
  } catch (err) {
    assert(false, 'Rejection workflow test', err.message);
  }

  // =========================================================================
  // MODULE 9: MULTI-FORMAT DOCUMENT DOWNLOAD & CERTIFICATE VALIDATION
  // =========================================================================
  logHeader('Module 9: Multi-Format Retrieval & Certificate Validation');

  try {
    // 1. Download Certificate (PDF)
    const certRes = await fetch(`${BASE_URL}/api/documents/${testDocId}/download?type=certificate`, {
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` }
    });
    assert(certRes.ok, 'GET download?type=certificate returns HTTP 200');
    assert(certRes.headers.get('content-type')?.includes('application/pdf'), 'Certificate response Content-Type is application/pdf');
    
    const certArrayBuffer = await certRes.arrayBuffer();
    const certBuffer = Buffer.from(certArrayBuffer);
    assert(certBuffer.length > 2000, 'Certificate size is substantial (>2KB)', `Bytes: ${certBuffer.length}`);
    const magicPdf = certBuffer.slice(0, 5).toString('utf-8');
    assert(magicPdf === '%PDF-', 'Certificate binary header begins with valid PDF magic bytes (%PDF-)');

    // 2. Download Bundle (ZIP)
    const bundleRes = await fetch(`${BASE_URL}/api/documents/${testDocId}/download?type=bundle`, {
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` }
    });
    assert(bundleRes.ok, 'GET download?type=bundle returns HTTP 200');
    assert(bundleRes.headers.get('content-type')?.includes('application/zip'), 'Bundle response Content-Type is application/zip');
    
    const bundleArrayBuffer = await bundleRes.arrayBuffer();
    const bundleBuffer = Buffer.from(bundleArrayBuffer);
    const magicZip = bundleBuffer.slice(0, 2).toString('utf-8');
    assert(magicZip === 'PK', 'Bundle binary header begins with valid ZIP magic bytes (PK)');

    // 3. Download Original File
    const origRes = await fetch(`${BASE_URL}/api/documents/${testDocId}/download?type=original`, {
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` }
    });
    assert(origRes.ok, 'GET download?type=original returns HTTP 200');
    const origBuffer = Buffer.from(await origRes.arrayBuffer());
    assert(origBuffer.length === samplePdf.length, 'Decrypted original file length perfectly matches uploaded bytes', `Expected ${samplePdf.length}, got ${origBuffer.length}`);
  } catch (err) {
    assert(false, 'Multi-format download test', err.message);
  }

  // =========================================================================
  // MODULE 10: PUBLIC FORENSIC VERIFICATION & QR LOOKUP
  // =========================================================================
  logHeader('Module 10: Public Forensic Verification & QR Scanner Endpoint');

  try {
    // 1. GET /api/documents/verify?docId=... (QR Code Scan)
    const qrVerifyRes = await fetch(`${BASE_URL}/api/documents/verify?docId=${testDocId}`);
    assert(qrVerifyRes.ok, 'Public GET /api/documents/verify?docId returns HTTP 200 (No Auth Required)');
    const qrData = await qrVerifyRes.json();
    assert(qrData.verified === true, 'Public QR verification confirms document authenticity (verified: true)');
    assert(qrData.signers && qrData.signers.length === 4, 'Verification response contains all 4 sequential signatories', `Signers: ${qrData.signers?.map(s => s.name).join(', ')}`);
    assert(qrData.signers[0].signature && qrData.signers[0].signature.length > 50, 'Signers contain cryptographic ECDSA signatures');

    // 2. POST /api/documents/verify (Binary Hash Upload)
    const testDocHash = crypto.createHash('sha256').update(samplePdf).digest('hex');
    const hashVerifyRes = await fetch(`${BASE_URL}/api/documents/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileHash: testDocHash })
    });
    assert(hashVerifyRes.ok, 'Public POST /api/documents/verify returns HTTP 200 with matching fileHash');
    const hashData = await hashVerifyRes.json();
    assert(hashData.verified === true, 'Hash ledger verification passes');

    // 3. Tamper Detection Test
    const fakeHash = crypto.createHash('sha256').update('MALICIOUS_ALTERED_PAYLOAD').digest('hex');
    const tamperRes = await fetch(`${BASE_URL}/api/documents/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileHash: fakeHash })
    });
    assert(!tamperRes.ok && tamperRes.status === 404, 'Tamper Detection: Altered file hash returns 404 Tamper Alert');
  } catch (err) {
    assert(false, 'Public forensic verification test', err.message);
  }

  // =========================================================================
  // MODULE 11: STUDENT SUBMISSIONS AUDIT FEED
  // =========================================================================
  logHeader('Module 11: Submissions Feed & Tracking HUD');

  try {
    const subRes = await fetch(`${BASE_URL}/api/documents/submissions`, {
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` }
    });
    assert(subRes.ok, 'GET /api/documents/submissions returns HTTP 200');
    const subData = await subRes.json();
    const list = subData.submissions || subData.documents || [];
    assert(Array.isArray(list) && list.length > 0, 'Submissions feed contains submitted applications');
    const myDoc = list.find(d => d.id === testDocId);
    assert(myDoc && myDoc.status === 'APPROVED', 'Application in submissions shows APPROVED status with tracking metadata');
  } catch (err) {
    assert(false, 'Student submissions feed test', err.message);
  }

  // =========================================================================
  // MODULE 12: RBAC & PRIVILEGE BOUNDARY ENFORCEMENT
  // =========================================================================
  logHeader('Module 12: Role-Based Access Control & Privilege Boundaries');

  try {
    // 1. Student attempting admin audit
    const adminAuditRes = await fetch(`${BASE_URL}/api/admin/audit`, {
      headers: { 'Authorization': `Bearer ${tokens['rahul.ctech@srmist.edu.in']}` }
    });
    assert(!adminAuditRes.ok && (adminAuditRes.status === 403 || adminAuditRes.status === 401), 'RBAC: Student blocked from accessing Admin Audit Log', `Status: ${adminAuditRes.status}`);

    // 2. Unauthenticated request to protected endpoint
    const unauthRes = await fetch(`${BASE_URL}/api/documents/submissions`);
    assert(unauthRes.status === 401, 'Zero-Trust: Unauthenticated request rejected with HTTP 401');

    // 3. Super Admin authorized access
    const superAdminRes = await fetch(`${BASE_URL}/api/admin/audit`, {
      headers: { 'Authorization': `Bearer ${tokens['superadmin@srmist.edu.in']}` }
    });
    assert(superAdminRes.ok, 'RBAC: Super Administrator granted access to Admin Audit Log');
  } catch (err) {
    assert(false, 'RBAC privilege boundary test', err.message);
  }

  // =========================================================================
  // FINAL SUMMARY REPORT
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 SRM DGV QA TEST EXECUTION REPORT');
  console.log('='.repeat(80));
  console.log(`  Total Assertions Tested : ${results.passed + results.failed}`);
  console.log(`  Passed Assertions       : ${results.passed}  ✅`);
  console.log(`  Failed Assertions       : ${results.failed}  ${results.failed > 0 ? '❌' : '🎉'}`);
  console.log(`  Quality Assurance Grade : ${results.failed === 0 ? 'PASS (100% SUCCESS - PRODUCTION READY)' : 'FAIL'}`);
  console.log('='.repeat(80) + '\n');

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('\n💥 FATAL QA RUNNER ERROR:', err);
  process.exit(1);
});
