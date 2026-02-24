-- Markly: Initial Database Schema
-- Run this in your Supabase SQL Editor (supabase.com > SQL Editor)

-- ============================================
-- 1. Profiles table (synced from auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. Bookmarks table
-- ============================================
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  url text not null,
  title text not null default '',
  description text default '',
  favicon_url text default '',
  og_image_url text default '',
  category text default '',
  order_index integer default 0,
  visit_count integer default 0,
  last_visited_at timestamptz,
  is_favorite boolean default false,
  short_url text,
  reminder_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.bookmarks enable row level security;

drop policy if exists "Users can view their own bookmarks" on public.bookmarks;
create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own bookmarks" on public.bookmarks;
create policy "Users can create their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own bookmarks" on public.bookmarks;
create policy "Users can update their own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own bookmarks" on public.bookmarks;
create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_category_idx on public.bookmarks(category);
create index if not exists bookmarks_created_at_idx on public.bookmarks(created_at desc);

-- ============================================
-- 3. Tags
-- ============================================
create table if not exists public.bookmark_tags (
  id uuid default gen_random_uuid() primary key,
  bookmark_id uuid references public.bookmarks(id) on delete cascade not null,
  tag text not null,
  created_at timestamptz default now() not null,
  unique(bookmark_id, tag)
);

alter table public.bookmark_tags enable row level security;

drop policy if exists "Users can view their bookmark tags" on public.bookmark_tags;
create policy "Users can view their bookmark tags"
  on public.bookmark_tags for select
  using (
    exists (
      select 1 from public.bookmarks
      where bookmarks.id = bookmark_tags.bookmark_id
      and bookmarks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage their bookmark tags" on public.bookmark_tags;
create policy "Users can manage their bookmark tags"
  on public.bookmark_tags for insert
  with check (
    exists (
      select 1 from public.bookmarks
      where bookmarks.id = bookmark_tags.bookmark_id
      and bookmarks.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their bookmark tags" on public.bookmark_tags;
create policy "Users can delete their bookmark tags"
  on public.bookmark_tags for delete
  using (
    exists (
      select 1 from public.bookmarks
      where bookmarks.id = bookmark_tags.bookmark_id
      and bookmarks.user_id = auth.uid()
    )
  );

create index if not exists bookmark_tags_bookmark_id_idx on public.bookmark_tags(bookmark_id);
create index if not exists bookmark_tags_tag_idx on public.bookmark_tags(tag);

-- ============================================
-- 4. Collections (table only — policies below after members table)
-- ============================================
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text default '',
  is_public boolean default false,
  share_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.collections enable row level security;

-- ============================================
-- 5. Collection members (must exist BEFORE policies that reference it)
-- ============================================
create table if not exists public.collection_members (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references public.collections(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'editor', 'viewer')) default 'viewer' not null,
  joined_at timestamptz default now() not null,
  unique(collection_id, user_id)
);

alter table public.collection_members enable row level security;

create index if not exists collection_members_collection_idx on public.collection_members(collection_id);
create index if not exists collection_members_user_idx on public.collection_members(user_id);

-- ============================================
-- 6. Collection bookmarks (many-to-many)
-- ============================================
create table if not exists public.collection_bookmarks (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references public.collections(id) on delete cascade not null,
  bookmark_id uuid references public.bookmarks(id) on delete cascade not null,
  order_index integer default 0,
  added_at timestamptz default now() not null,
  unique(collection_id, bookmark_id)
);

alter table public.collection_bookmarks enable row level security;

create index if not exists collection_bookmarks_collection_idx on public.collection_bookmarks(collection_id);
create index if not exists collection_bookmarks_bookmark_idx on public.collection_bookmarks(bookmark_id);

-- ============================================
-- 7. RLS policies for collections (now safe — all referenced tables exist)
-- ============================================
drop policy if exists "Users can view own collections" on public.collections;
create policy "Users can view own collections"
  on public.collections for select
  using (auth.uid() = user_id);

drop policy if exists "Users can view collections they are members of" on public.collections;
create policy "Users can view collections they are members of"
  on public.collections for select
  using (
    exists (
      select 1 from public.collection_members
      where collection_members.collection_id = collections.id
      and collection_members.user_id = auth.uid()
    )
  );

drop policy if exists "Public collections are visible to all" on public.collections;
create policy "Public collections are visible to all"
  on public.collections for select
  using (is_public = true);

drop policy if exists "Users can create collections" on public.collections;
create policy "Users can create collections"
  on public.collections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Owners can update their collections" on public.collections;
create policy "Owners can update their collections"
  on public.collections for update
  using (auth.uid() = user_id);

drop policy if exists "Owners can delete their collections" on public.collections;
create policy "Owners can delete their collections"
  on public.collections for delete
  using (auth.uid() = user_id);

-- ============================================
-- 8. RLS policies for collection_bookmarks
-- ============================================
drop policy if exists "Collection bookmarks visible to collection viewers" on public.collection_bookmarks;
create policy "Collection bookmarks visible to collection viewers"
  on public.collection_bookmarks for select
  using (
    exists (
      select 1 from public.collections
      where collections.id = collection_bookmarks.collection_id
      and (collections.user_id = auth.uid() or collections.is_public = true)
    )
    or exists (
      select 1 from public.collection_members
      where collection_members.collection_id = collection_bookmarks.collection_id
      and collection_members.user_id = auth.uid()
    )
  );

drop policy if exists "Collection owners can manage bookmarks" on public.collection_bookmarks;
create policy "Collection owners can manage bookmarks"
  on public.collection_bookmarks for insert
  with check (
    exists (
      select 1 from public.collections
      where collections.id = collection_bookmarks.collection_id
      and collections.user_id = auth.uid()
    )
  );

drop policy if exists "Collection owners can remove bookmarks" on public.collection_bookmarks;
create policy "Collection owners can remove bookmarks"
  on public.collection_bookmarks for delete
  using (
    exists (
      select 1 from public.collections
      where collections.id = collection_bookmarks.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- ============================================
-- 9. RLS policies for collection_members
-- ============================================
drop policy if exists "Members can view their memberships" on public.collection_members;
create policy "Members can view their memberships"
  on public.collection_members for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.collections
      where collections.id = collection_members.collection_id
      and collections.user_id = auth.uid()
    )
  );

drop policy if exists "Collection owners can manage members" on public.collection_members;
create policy "Collection owners can manage members"
  on public.collection_members for insert
  with check (
    exists (
      select 1 from public.collections
      where collections.id = collection_members.collection_id
      and collections.user_id = auth.uid()
    )
  );

drop policy if exists "Collection owners can remove members" on public.collection_members;
create policy "Collection owners can remove members"
  on public.collection_members for delete
  using (
    exists (
      select 1 from public.collections
      where collections.id = collection_members.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- ============================================
-- 10. Enable Realtime
-- ============================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookmarks') then
    alter publication supabase_realtime add table public.bookmarks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collections') then
    alter publication supabase_realtime add table public.collections;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collection_bookmarks') then
    alter publication supabase_realtime add table public.collection_bookmarks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collection_members') then
    alter publication supabase_realtime add table public.collection_members;
  end if;
end;
$$;
