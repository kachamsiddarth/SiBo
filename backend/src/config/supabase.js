import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseClient = null;

/**
 * Initializes and returns the Supabase client instance.
 * Uses SUPABASE_SERVICE_ROLE_KEY on the trusted backend server.
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder')) {
    console.warn('⚠️ Supabase client running in placeholder mode.');
  }

  supabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return supabaseClient;
}

export const supabase = getSupabaseClient();
