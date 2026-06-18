import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
