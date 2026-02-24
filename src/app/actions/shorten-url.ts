"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Generate a random 6-character alphanumeric code
function generateCode(length = 6): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Generate or retrieve a short URL for a bookmark.
 * If one already exists, returns the existing one.
 */
export async function generateShortUrl(bookmarkId: string): Promise<{
    code: string;
    shortUrl: string;
    clickCount: number;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check if short URL already exists for this bookmark
    const { data: existing } = await supabase
        .from("short_urls")
        .select("code, click_count")
        .eq("bookmark_id", bookmarkId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existing) {
        return {
            code: existing.code,
            shortUrl: `/s/${existing.code}`,
            clickCount: existing.click_count,
        };
    }

    // Generate a unique code with collision retry
    let code = generateCode();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        const { data: collision } = await supabase
            .from("short_urls")
            .select("id")
            .eq("code", code)
            .maybeSingle();

        if (!collision) break;
        code = generateCode();
        attempts++;
    }

    if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique short code. Please try again.");
    }

    // Insert the short URL
    const { data: shortUrl, error } = await supabase
        .from("short_urls")
        .insert({
            code,
            bookmark_id: bookmarkId,
            user_id: user.id,
        })
        .select("code, click_count")
        .single();

    if (error) {
        throw new Error(`Failed to create short URL: ${error.message}`);
    }

    // Also update the bookmark's short_url field for quick display
    await supabase
        .from("bookmarks")
        .update({ short_url: `/s/${shortUrl.code}` })
        .eq("id", bookmarkId)
        .eq("user_id", user.id);

    revalidatePath("/dashboard");

    return {
        code: shortUrl.code,
        shortUrl: `/s/${shortUrl.code}`,
        clickCount: shortUrl.click_count,
    };
}

/**
 * Get click stats for a bookmark's short URL.
 */
export async function getShortUrlStats(bookmarkId: string): Promise<{
    code: string;
    clickCount: number;
} | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data } = await supabase
        .from("short_urls")
        .select("code, click_count")
        .eq("bookmark_id", bookmarkId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!data) return null;

    return {
        code: data.code,
        clickCount: data.click_count,
    };
}

/**
 * Delete a short URL for a bookmark.
 */
export async function deleteShortUrl(bookmarkId: string): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    await supabase
        .from("short_urls")
        .delete()
        .eq("bookmark_id", bookmarkId)
        .eq("user_id", user.id);

    // Clear the short_url field on the bookmark
    await supabase
        .from("bookmarks")
        .update({ short_url: null })
        .eq("id", bookmarkId)
        .eq("user_id", user.id);

    revalidatePath("/dashboard");
}
