import { createClient } from '@supabase/supabase-js';
import { MMKVSupabaseAdapter } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

console.log('[SUPABASE] Initializing Supabase client...');
console.log('[SUPABASE] Environment variables:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  anonKeyLength: supabaseAnonKey?.length || 0,
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] Missing environment variables:', {
    EXPO_PUBLIC_SUPABASE_URL: !!supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
  });
  throw new Error('Missing Supabase environment variables');
}

console.log('[SUPABASE] Creating MMKVSupabaseAdapter...');
const storageAdapter = new MMKVSupabaseAdapter();
console.log('[SUPABASE] Storage adapter created successfully');

// Create the Supabase client with MMKV storage
console.log('[SUPABASE] Creating Supabase client with configuration...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('[SUPABASE] Supabase client created successfully');

// Test the client connection
supabase.auth
  .getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('[SUPABASE] Initial session check failed:', error);
    } else {
      console.log('[SUPABASE] Initial session check completed:', {
        hasSession: !!data.session,
      });
    }
  })
  .catch(error => {
    console.error('[SUPABASE] Exception during initial session check:', error);
  });
