-- Migration 009: Allow members to view bookmarks in their shared collections
-- This fixes the issue where shared collections appear empty for recipients.

-- 1. Create a policy for viewing bookmarks via collection membership
DROP POLICY IF EXISTS "Users can view bookmarks shared with them via collections" ON public.bookmarks;

CREATE POLICY "Users can view bookmarks shared with them via collections"
ON public.bookmarks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collection_bookmarks cb
    JOIN public.collection_members cm ON cb.collection_id = cm.collection_id
    WHERE cb.bookmark_id = bookmarks.id
    AND cm.user_id = auth.uid()
  )
);

-- Note: The existing "Users can view their own bookmarks" policy still applies and is combined with OR.
