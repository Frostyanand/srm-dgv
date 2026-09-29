/**
 * SRM Digital Verification Platform (SRM DGV)
 * Initial Genesis SuperAdmin Provisioning Script
 * 
 * Usage:
 *   node scripts/seed_superadmin.mjs [email] [password] [name]
 * 
 * Example:
 *   node scripts/seed_superadmin.mjs superadmin@srmist.edu.in "SRM#SecureAdmin2026!" "SRM Super Administrator"
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Load environment variables from .env
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch (err) {
    console.warn('Could not auto-load .env file. Ensure environment variables are loaded.');
  }
}

const email = process.argv[2] || 'superadmin@srmist.edu.in';
const password = process.argv[3] || 'SRM#SecureAdmin2026!';
const name = process.argv[4] || 'SRM Super Administrator';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
privateKey = privateKey.replace(/^"|"$/g, '').replace(/^'|'$/g, '').replace(/\\n/g, '\n');

const masterKey = process.env.MASTER_PRIVATE_KEY_ENCRYPTION_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('\n❌ ERROR: Firebase Admin credentials missing from .env!');
  console.error('Please ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
  process.exit(1);
}

if (!masterKey) {
  console.error('\n❌ ERROR: MASTER_PRIVATE_KEY_ENCRYPTION_KEY is missing from .env!');
  process.exit(1);
}

// 1. Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

async function seed() {
  console.log(`\n🚀 Provisioning Genesis SuperAdmin for SRM DGV...`);
  console.log(`Email: ${email}`);
  console.log(`Name:  ${name}\n`);

  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`ℹ️  Existing Firebase Auth user found (UID: ${uid}). Updating password and claims...`);
    await auth.updateUser(uid, {
      password,
      displayName: name,
    });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      uid = newUser.uid;
      console.log(`✅ Created Firebase Auth user (UID: ${uid})`);
    } else {
      throw err;
    }
  }

  // 2. Assign Custom Role Claim
  await auth.setCustomUserClaims(uid, {
    role: 'SUPER_ADMIN',
    requiresPasswordReset: false,
  });
  console.log(`✅ Assigned custom claim: { role: 'SUPER_ADMIN' }`);

  // 3. Generate ECDSA Keypair
  const { publicKey, privateKey: userPrivateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // 4. Encrypt Private Key with Master Key
  const kek = crypto.createHash('sha256').update(masterKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  let encryptedKey = cipher.update(userPrivateKey, 'utf8', 'hex');
  encryptedKey += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // 5. Save/Update in Firestore
  await db.collection('users').doc(uid).set({
    email,
    name,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    departmentId: null,
    publicKey,
    encryptedPrivateKey: {
      encryptedKey,
      iv: iv.toString('hex'),
      authTag,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, { merge: true });

  console.log(`✅ Stored SuperAdmin record and ECDSA keys in Firestore users/${uid}`);
  console.log(`\n🎉 SUCCESS! SuperAdmin is fully provisioned!`);
  console.log(`--------------------------------------------------------`);
  console.log(`Login at: http://localhost:3000/login`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`--------------------------------------------------------\n`);
}

seed().catch(err => {
  console.error('\n❌ Provisioning failed:', err);
  process.exit(1);
});
