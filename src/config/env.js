/**
 * Environment configuration validation
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'MASTER_FILE_ENCRYPTION_KEY',
  'MASTER_PRIVATE_KEY_ENCRYPTION_KEY',
  'MASTER_AUDIT_KEY',
  'RESEND_API_KEY'
];

/**
 * Validates the presence of required environment variables
 */
function validateEnv() {
  if (typeof window !== 'undefined') return; // Skip dynamic validation in the browser

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

// Automatically validate when imported
validateEnv();

export const env = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  security: {
    masterFileEncryptionKey: process.env.MASTER_FILE_ENCRYPTION_KEY,
    masterPrivateKeyEncryptionKey: process.env.MASTER_PRIVATE_KEY_ENCRYPTION_KEY,
    masterAuditKey: process.env.MASTER_AUDIT_KEY,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
  },
  isProduction: process.env.NODE_ENV === 'production',
};
