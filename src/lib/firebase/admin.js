import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '@/config/env';

/**
 * Initializes Firebase Admin SDK
 * Safe to call multiple times (e.g. in development hot reloads)
 */
function initFirebaseAdmin() {
  if (getApps().length === 0) {
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !env.firebase.projectId) {
      console.warn('Firebase Admin credentials not fully configured. Some features may fail.');
    }

    try {
      // Bulletproof private key parsing for Vercel:
      // 1. Remove surrounding double/single quotes if the user accidentally copied them.
      // 2. Replace literal '\n' string sequences with actual newline characters.
      let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
      rawKey = rawKey.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      const cleanKey = rawKey.replace(/\\n/g, '\n');

      initializeApp({
        credential: cert({
          projectId: env.firebase.projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: cleanKey,
        }),
      });
      console.log('Firebase Admin Initialized successfully.');
    } catch (error) {
      console.error('Firebase Admin Initialization Error', error);
      throw error;
    }
  }
}

initFirebaseAdmin();

export const adminAuth = getAuth();
export const adminDb = getFirestore();
