import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { AppError } from '../utils/app-error.js';

const authOptions = { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false };

export const supabasePublic = env.supabaseConfigured
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: authOptions })
  : null;

// Service-role access is restricted to trusted backend jobs and server-validated writes.
// Never attach this client to req or return its key to the browser.
export const supabaseAdmin = env.supabaseAdminConfigured
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: authOptions })
  : null;

export function createUserSupabaseClient(accessToken) {
  if (!supabasePublic) {
    throw new AppError(503, 'SUPABASE_NOT_CONFIGURED', 'Supabase is not configured on this backend.');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: authOptions
  });
}

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new AppError(503, 'SUPABASE_ADMIN_NOT_CONFIGURED', 'Backend database operations are not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.');
  }
  return supabaseAdmin;
}
