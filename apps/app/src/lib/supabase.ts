import { createClient } from '@supabase/supabase-js';
import { MMKVSupabaseAdapter } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client with MMKV storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new MMKVSupabaseAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
