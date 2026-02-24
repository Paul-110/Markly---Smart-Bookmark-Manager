-- Create visit_logs table
CREATE TABLE IF NOT EXISTS visit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE visit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own visit logs" ON visit_logs;
CREATE POLICY "Users can view their own visit logs"
    ON visit_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own visit logs" ON visit_logs;
CREATE POLICY "Users can insert their own visit logs"
    ON visit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_visit_logs_bookmark_id ON visit_logs(bookmark_id);
CREATE INDEX idx_visit_logs_visited_at ON visit_logs(visited_at);

-- RPC for incrementing visit count
CREATE OR REPLACE FUNCTION increment_visit_count(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE bookmarks
  SET visit_count = visit_count + 1,
      last_visited_at = now()
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
