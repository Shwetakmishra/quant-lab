import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev + preview both pinned to port 3000 so the local URL matches the
// Supabase Site URL / Redirect URL config (http://localhost:3000).
// strictPort: fail loudly instead of silently hopping to 3001, which would
// break the magic-link redirect.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
})
