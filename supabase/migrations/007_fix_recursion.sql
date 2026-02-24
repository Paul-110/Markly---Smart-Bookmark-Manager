-- ============================================
-- 007: Fix Infinite Recursion in RLS
-- Fixes "infinite recursion detected in policy" error
-- ============================================

-- VALIDATION: Drop the policy first to ensure we replace it cleanly
drop policy if exists "Members can view their memberships" on public.collection_members;

-- 1. Create a helper function to check ownership without triggering RLS recursively
-- SECURITY DEFINER allows this function to bypass RLS on the 'collections' table
create or replace function public.is_collection_owner(c_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.collections
    where id = c_id
    and user_id = auth.uid()
  );
$$;

-- 2. Re-create the policy using the helper function
create policy "Members can view their memberships"
  on public.collection_members for select
  using (
    auth.uid() = user_id -- Users can see themselves
    or public.is_collection_owner(collection_id) -- Owners can see everyone in their collection
  );
