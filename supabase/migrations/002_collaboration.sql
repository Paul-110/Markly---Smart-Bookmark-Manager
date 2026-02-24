-- Markly: Collaboration Features Migration

-- ============================================
-- 1. Secure Member Lookup Function
-- Allows authenticated users to look up a profile by email
-- (Bypasses RLS strictly for this lookup)
-- ============================================
create or replace function public.get_profile_by_email(email_input text)
returns setof public.profiles
language sql
security definer
set search_path = public
as $$
  select * from public.profiles
  where email = email_input;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_profile_by_email(text) to authenticated;


-- ============================================
-- 2. Update RLS for Collection Bookmarks
-- Allow "editors" to add and remove bookmarks
-- ============================================

-- Drop existing restrictive policies
drop policy if exists "Collection owners can manage bookmarks" on public.collection_bookmarks;
drop policy if exists "Collection owners can remove bookmarks" on public.collection_bookmarks;

-- New Insert Policy: Owners OR Editors
drop policy if exists "Owners and Editors can add bookmarks" on public.collection_bookmarks;
create policy "Owners and Editors can add bookmarks"
  on public.collection_bookmarks for insert
  with check (
    exists (
      select 1 from public.collections
      where collections.id = collection_bookmarks.collection_id
      and collections.user_id = auth.uid()
    )
    or exists (
      select 1 from public.collection_members
      where collection_members.collection_id = collection_bookmarks.collection_id
      and collection_members.user_id = auth.uid()
      and collection_members.role in ('owner', 'editor')
    )
  );

-- New Delete Policy: Owners OR Editors
drop policy if exists "Owners and Editors can remove bookmarks" on public.collection_bookmarks;
create policy "Owners and Editors can remove bookmarks"
  on public.collection_bookmarks for delete
  using (
    exists (
      select 1 from public.collections
      where collections.id = collection_bookmarks.collection_id
      and collections.user_id = auth.uid()
    )
    or exists (
      select 1 from public.collection_members
      where collection_members.collection_id = collection_bookmarks.collection_id
      and collection_members.user_id = auth.uid()
      and collection_members.role in ('owner', 'editor')
    )
  );
