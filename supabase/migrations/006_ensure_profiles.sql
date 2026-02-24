-- ============================================
-- 006: Ensure Profiles Exist (Backfill)
-- Fixes "violates foreign key constraint bookmarks_user_id_fkey"
-- ============================================

-- Insert a profile for every user in auth.users that doesn't have one in public.profiles
insert into public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
select 
  id, 
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', email) as full_name,
  raw_user_meta_data ->> 'avatar_url' as avatar_url,
  created_at,
  now()
from auth.users
on conflict (id) do nothing;
