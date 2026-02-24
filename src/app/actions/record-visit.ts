"use server";

import { createClient } from "@/lib/supabase/server";

export async function recordVisit(bookmarkId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Increment visit_count via RPC
    const { error: rpcError } = await supabase.rpc('increment_visit_count', { row_id: bookmarkId });
    if (rpcError) console.error("Error incrementing visit count:", rpcError);

    // Initial log entry
    const { error: logError } = await supabase.from("visit_logs").insert({
        bookmark_id: bookmarkId,
        user_id: user.id
    });
    if (logError) console.error("Error logging visit:", logError);
}
