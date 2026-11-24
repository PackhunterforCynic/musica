import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ymzpafxyrmiaizxacmrx.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable__KMOip_y1JJDamZ61CdNQA_lWMJx3qJ';

let client: SupabaseClient;

try {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} catch (err: any) {
  console.warn('[Supabase] Failed to initialize Supabase client:', err.message);
  // Fallback dummy client
  client = createClient('https://placeholder.supabase.co', 'placeholder', {
    auth: { persistSession: false },
  });
}

export const supabase = client;
export { supabaseUrl, supabaseAnonKey };
