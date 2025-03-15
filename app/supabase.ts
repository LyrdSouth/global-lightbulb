import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual values when we set up Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create the Supabase client with more network-friendly configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 1, // Reduce to minimum to avoid rate limiting
    },
    // Remove timeout to let browser handle it naturally
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
}); 