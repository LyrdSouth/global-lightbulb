import { PostgrestError } from '@supabase/supabase-js';

export function handleSupabaseError(error: PostgrestError | Error | unknown): string {
  if (!error) return 'An unknown error occurred';
  
  // Handle PostgrestError
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError;
    
    // Common Supabase error codes
    switch (pgError.code) {
      case '42P01':
        return 'Table does not exist. Please check your Supabase setup.';
      case '42501':
        return 'Insufficient permissions. Please check your RLS policies.';
      case '23505':
        return 'Duplicate entry. This record already exists.';
      case 'PGRST116':
        return 'Resource not found or insufficient permissions.';
      default:
        return pgError.message || 'Database error occurred';
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle unknown errors
  return 'An unknown error occurred';
} 