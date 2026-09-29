import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

if (!env.supabase.url || !env.supabase.anonKey) {
  console.warn('Supabase URL or Anon Key is missing. Storage features may fail.');
}

// We initialize a client with the service role key to securely bypass RLS for server-side storage operations.
export const supabaseClient = createClient(
  env.supabase.url || '',
  env.supabase.serviceRoleKey || env.supabase.anonKey || ''
);
