# Quant Lab — GRE Quant Revision

A calm, focused study app: **Flashcards**, **Quizzes**, and a searchable **Formula Sheet**
across 7 topics. React + Vite, Supabase magic-link auth, progress synced per user.
Built to faithfully reproduce the Claude Design handoff (`design_handoff_quant_lab`).

---

## Run it locally (preview first)

```bash
# 1. Install
npm install

# 2. Add your Supabase anon key
#    Open .env.local and paste your anon/public key after the = sign:
#      VITE_SUPABASE_ANON_KEY=eyJhbGci...
#    (VITE_SUPABASE_URL is already set. Never put the service_role key here.)

# 3. Start the dev server
npm run dev
```

Then open **http://localhost:3000** — the port is pinned (`strictPort`) so it always
matches your Supabase Site URL / Redirect URL config.

Other commands:

```bash
npm run build     # production build to dist/
npm run preview   # serve the built app, also on http://localhost:3000
```

> Until the anon key is filled in, the sign-in screen shows a "Supabase isn't configured"
> hint and the magic link won't send. Add the key and restart `npm run dev`.

---

## Auth — magic link (passwordless)

- Enter an email → **Send magic link** calls
  `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })`.
- A "check your email" state confirms it was sent.
- Clicking the emailed link returns you to `http://localhost:3000`; the session is
  established via `detectSessionInUrl` + `onAuthStateChange` / `getSession`.
- The whole app is gated behind auth; a **sign-out** button sits in the header
  (desktop) and the top bar (mobile).

The Supabase URL and anon key are read **only** from `import.meta.env.*`
(`src/lib/supabase.js`). No keys are hardcoded; the service_role key is never used
in the client.

---

## Data sync (Supabase)

All progress is tied to the signed-in user (`auth.uid()`), loaded on sign-in and
written back as it changes. **Row Level Security is assumed ON**, so every query is
implicitly scoped to the current user. Writes are optimistic and best-effort: local
state updates instantly, and a failed network write surfaces an "Offline · saved
locally" badge instead of losing your progress.

Tables used (already created in your project):

| Table | Columns | Written when |
|---|---|---|
| `card_reviews` | `user_id, card_id, status, updated_at` | you mark a card **Got it** (`known`) or **Review again** (`review`) |
| `quiz_attempts` | `id, user_id, topic, score, total, taken_at` | a quiz finishes — **one row per topic** in the set |

**One setup note for `card_reviews`:** flag writes use an upsert on
`(user_id, card_id)`, so that pair needs a **unique constraint** (or composite PK).
If it's missing, add it once:

```sql
alter table card_reviews
  add constraint card_reviews_user_card_unique unique (user_id, card_id);
```

Suggested RLS policies (if not already in place):

```sql
alter table card_reviews enable row level security;
alter table quiz_attempts enable row level security;

create policy "own rows" on card_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on quiz_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Weak topics** on the dashboard ("Focus areas") are derived from `quiz_attempts`:
topics with the lowest average score across all your attempts.

---

## Content

All math content lives in **`src/data/content.json`** — `topics`, `flashcards`,
`quizzes`, `formulas`. It was parsed from `quant-notes.md`; formulas are stored as
KaTeX/LaTeX strings and rendered with [KaTeX](https://katex.org/) so superscripts,
√, fractions, Σ, π, μ, σ all display crisply. Edit the JSON to change content
without touching any app logic. (All 120 formula/card strings are validated to
render without errors.)

---

## Project structure

```
src/
  data/content.json        # all content (edit me)
  lib/
    supabase.js            # client from import.meta.env (anon key only)
    content.js             # derived groupings + global search index
    Math.jsx               # KaTeX render helpers (block + inline $…$)
  hooks/
    useAuth.js             # magic link, session, sign-out
    useProgress.js         # card_reviews + quiz_attempts load/sync, weakTopics()
    useMediaQuery.js       # responsive breakpoint (≥768px = sidebar)
  components/               # Sidebar, Header, MobileChrome, GlobalSearch, Icons, UI
  screens/                 # SignIn, Home, Flashcards, Quiz, Formulas
  App.jsx                  # auth gate + responsive layout + global state
```

Responsive: sidebar + header layout at ≥768px, top-bar + bottom-tab layout below.

---

## Design system (from the handoff)

- **Color:** navy `#46417B` primary, warm accent `#F2A085`, canvas `#F8F6FC`; status
  greens/reds/blues/teals with matching washes. All as CSS variables in `index.css`.
- **Type:** Public Sans (variable, bundled in `public/fonts`).
- **Components:** rounded cards (16–24px), pill buttons, topic chips, the 3D flip
  card (`.55s cubic-bezier(.4,0,.2,1)`), MCQ option rows (default/selected/correct/
  wrong), progress rings & bars, search fields.
- **Micro-interactions:** card flip, quiz answer-feedback fade-in, search-as-you-type
  popovers, hover lifts.

---

## Deploying (Vercel)

This is a static Vite SPA, hosted free on Vercel's CDN. Settings live in
`vercel.json` (framework `vite`, build `npm run build`, output `dist`, SPA rewrite).

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new) — Vercel
   auto-detects Vite.
2. Add **Environment Variables** (Settings → Environment Variables), for all
   environments. **Vite inlines these at build time**, so they must be set before
   the build:
   - `VITE_SUPABASE_URL` = `https://<your-project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your anon/public key
3. Deploy. Then add your Vercel URL (e.g. `https://quant-lab.vercel.app`) to
   **Supabase → Authentication → URL Configuration**: set it as the **Site URL** and
   add it (plus `/**`) to **Redirect URLs**, so magic links return to production.
   `emailRedirectTo` uses `window.location.origin`, so no code change is needed.

Every push to the default branch triggers an automatic redeploy.

> **Later (not in this build):** a "Generate more questions" button using the
> Anthropic API. It needs the API key kept server-side, so it'll be added as a small
> backend step once the core app is confirmed working locally.
