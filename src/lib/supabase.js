import { createClient } from '@supabase/supabase-js'

// Strip ALL whitespace: a Supabase URL and a JWT anon key never contain any, so
// this safely repairs values that picked up a stray newline/space when pasted
// into a host's env-var field (which otherwise produces a "fetch ... Invalid
// value" error when the key lands in an HTTP header).
const clean = (v) => (v || '').replace(/\s+/g, '')
const url = clean(import.meta.env.VITE_SUPABASE_URL)
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)

// Surfaced in the UI so a missing/blank .env.local fails loudly and helpfully
// rather than throwing deep inside the auth call.
export const isConfigured = Boolean(url && anonKey)

if (!isConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Quant Lab] Supabase is not configured. Add VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY to .env.local and restart the dev server.'
  )
}

// Only the public anon key is ever used here. Never the service_role key.
export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
