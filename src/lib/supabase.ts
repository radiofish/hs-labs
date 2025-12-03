import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Safely get environment variables - these will be available at runtime in Railway
// but may not be available during build/prerender
const supabaseUrl = typeof process !== 'undefined' 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL 
  : undefined
const supabaseAnonKey = typeof process !== 'undefined' 
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  : undefined

// Only create Supabase client if environment variables are available and non-empty
// This prevents errors during prerendering when env vars might not be set
export const supabase: SupabaseClient | null = 
  (supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

