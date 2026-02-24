-- ========================================
-- 005: Short URLs for bookmark sharing
-- ========================================

-- Short URL mappings table
CREATE TABLE IF NOT EXISTS short_urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(8) NOT NULL UNIQUE,
    bookmark_id UUID NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup index on code
CREATE INDEX IF NOT EXISTS idx_short_urls_code ON short_urls(code);
CREATE INDEX IF NOT EXISTS idx_short_urls_bookmark ON short_urls(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_short_urls_user ON short_urls(user_id);

-- RLS
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;

-- Users can read their own short URLs
DROP POLICY IF EXISTS "Users can read own short_urls" ON short_urls;
CREATE POLICY "Users can read own short_urls"
    ON short_urls FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create short URLs for their bookmarks
DROP POLICY IF EXISTS "Users can create own short_urls" ON short_urls;
CREATE POLICY "Users can create own short_urls"
    ON short_urls FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own short URLs
DROP POLICY IF EXISTS "Users can delete own short_urls" ON short_urls;
CREATE POLICY "Users can delete own short_urls"
    ON short_urls FOR DELETE
    USING (auth.uid() = user_id);

-- Public read for anyone (redirect endpoint needs this)
DROP POLICY IF EXISTS "Anyone can read short_urls by code" ON short_urls;
CREATE POLICY "Anyone can read short_urls by code"
    ON short_urls FOR SELECT
    USING (true);

-- Atomic click counter RPC
CREATE OR REPLACE FUNCTION increment_short_url_clicks(short_code VARCHAR)
RETURNS void AS $$
BEGIN
    UPDATE short_urls
    SET click_count = click_count + 1
    WHERE code = short_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
