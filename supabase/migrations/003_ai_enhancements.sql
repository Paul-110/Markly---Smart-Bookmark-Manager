-- Markly: AI Enhancements Migration

-- ============================================
-- 1. AI Summary Column
-- Store generated summary for bookmarks
-- ============================================
alter table public.bookmarks
add column if not exists ai_summary text;

-- ============================================
-- 2. AI Suggested Collections (Optional Cache)
-- But usually suggestions are transient.
-- If we want to persist them for user review:
-- ============================================
create table if not exists public.ai_suggested_collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  bookmark_ids uuid[] default '{}',
  reasoning text,
  status text default 'pending', -- pending, accepted, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.ai_suggested_collections enable row level security;

drop policy if exists "Users can manage their suggested collections" on public.ai_suggested_collections;
create policy "Users can manage their suggested collections"
  on public.ai_suggested_collections
  using (auth.uid() = user_id);
