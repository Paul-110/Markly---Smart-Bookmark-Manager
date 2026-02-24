import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getBookmarkStats() {
    const { data: bookmarks, error } = await supabase
        .from("bookmarks")
        .select("id, category, visit_count, created_at, last_visited_at, url");

    if (error) throw error;

    const { data: tags } = await supabase
        .from("bookmark_tags")
        .select("bookmark_id, tag");

    return { bookmarks: bookmarks || [], tags: tags || [] };
}
