import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual values when we set up Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create the Supabase client with more resilient configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 5, // Reduced to avoid rate limiting
    },
    // Add a timeout for WebSocket connections
    timeout: 30000, // 30 seconds
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Disable WebSocket retries to avoid console spam
  global: {
    fetch: (...args) => fetch(...args),
  },
}); 