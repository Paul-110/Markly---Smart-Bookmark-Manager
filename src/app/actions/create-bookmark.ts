"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type CreateBookmarkInput = {
    url: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    favicon_url?: string;
    og_image_url?: string;
    is_favorite?: boolean;
    reminder_at?: string | null;
};

export async function createBookmarkAction(input: CreateBookmarkInput) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // 1. URL Validation & Sanitization
    const url = input.url.trim();
    if (!url) throw new Error("URL is required");

    // Block malicious protocols
    if (/^(javascript:|data:|file:|vbscript:)/i.test(url)) {
        throw new Error("Invalid URL protocol. Only http/https allowed.");
    }

    // Ensure valid URL format
    try {
        new URL(url.includes("://") ? url : `https://${url}`);
    } catch {
        throw new Error("Invalid URL format");
    }

    // 2. Rate Limiting (Server-side check)
    // Check how many bookmarks created in last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
        .from("bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", oneMinuteAgo);

    if (countError) {
        console.error("Rate limit check failed:", countError);
        // Fail open or closed? Let's generic fail for safety
        throw new Error("Failed to verify rate limit");
    }

    if (count !== null && count >= 10) {
        throw new Error("Rate limit exceeded: You can only add 10 bookmarks per minute.");
    }

    // 3. Logic: Get order index
    const { data: maxOrder } = await supabase
        .from("bookmarks")
        .select("order_index")
        .eq("user_id", user.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

    const nextOrder = (maxOrder?.order_index ?? -1) + 1;

    // 4. Insert Bookmark
    const { data: bookmark, error: insertError } = await supabase
        .from("bookmarks")
        .insert({
            user_id: user.id,
            url,
            title: input.title,
            description: input.description || "",
            favicon_url: input.favicon_url || "",
            og_image_url: input.og_image_url || "",
            category: input.category || "",
            order_index: nextOrder,
            is_favorite: input.is_favorite || false,
            reminder_at: input.reminder_at || null,
        })
        .select()
        .single();

    if (insertError) {
        throw new Error(`Failed to create bookmark: ${insertError.message}`);
    }

    // 5. Insert Tags
    if (input.tags && input.tags.length > 0) {
        const tagInserts = input.tags.map((tag) => ({
            bookmark_id: bookmark.id,
            tag,
        }));
        await supabase.from("bookmark_tags").insert(tagInserts);
    }

    revalidatePath("/dashboard");

    // Return complete bookmark including tags
    return { ...bookmark, tags: input.tags || [] };
}
