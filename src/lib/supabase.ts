import { createClient } from '@supabase/supabase-js';

// Supabase client singleton — safe to import anywhere.
// Falls back gracefully if env vars are missing (app will not crash,
// but DB writes/reads will be no-ops).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  console.warn('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. DB features disabled, localStorage fallback active.');
}

export const supabase = url && key ? createClient(url, key) : null;
