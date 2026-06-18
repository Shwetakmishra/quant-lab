-- Quant Lab — database schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query →
-- paste → Run. Safe to re-run (idempotent).

-- ── Tables ────────────────────────────────────────────────────────────────
create table if not exists public.card_reviews (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  card_id    text        not null,
  status     text        not null check (status in ('known', 'review')),
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)   -- also the unique key used by upsert(onConflict)
);

create table if not exists public.quiz_attempts (
  id       uuid        primary key default gen_random_uuid(),
  user_id  uuid        not null references auth.users (id) on delete cascade,
  topic    text        not null,
  score    int         not null,
  total    int         not null,
  taken_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_topic_idx
  on public.quiz_attempts (user_id, topic);

-- ── Row Level Security ───────────────────────────────────────────────────
-- With the anon key public, RLS is what protects the data: each user can only
-- read/write rows where user_id = their auth.uid().
alter table public.card_reviews  enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "own card_reviews" on public.card_reviews;
create policy "own card_reviews" on public.card_reviews
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own quiz_attempts" on public.quiz_attempts;
create policy "own quiz_attempts" on public.quiz_attempts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
