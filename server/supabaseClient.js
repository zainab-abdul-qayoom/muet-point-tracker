/**
 * Supabase Client Helper for MUET Point Tracker
 * 
 * Provides an optional Supabase database connection layer.
 * By default, the application runs on the ultra-reliable local SQLite engine (`muet_tracker.sqlite`).
 * To switch to Supabase:
 * 1. Execute `server/supabase_schema.sql` in your Supabase SQL Editor.
 * 2. Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment or .env file.
 * 3. Set DB_ENGINE=supabase.
 */

export function isSupabaseConfigured() {
  return Boolean(
    process.env.SUPABASE_URL && 
    (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function getActiveDbEngine() {
  if (process.env.DB_ENGINE === 'supabase' && isSupabaseConfigured()) {
    return 'supabase';
  }
  return 'sqlite';
}
