-- ============================================
-- 008: Add Position Column for Drag-and-Drop
-- ============================================

-- Add the position column if it doesn't exist
ALTER TABLE public.bookmarks 
ADD COLUMN IF NOT EXISTS position FLOAT DEFAULT 0;

-- Initialize position for existing bookmarks
-- We want the default order (created_at desc) to map to increasing position values
-- so that 'custom' sort (ascending position) matches 'newest' initially.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.bookmarks
)
UPDATE public.bookmarks
SET position = ranked.rn * 1024
FROM ranked
WHERE public.bookmarks.id = ranked.id;
