import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Public redirect endpoint: GET /s/:code
 * Looks up the short URL, increments click count, and 302 redirects.
 * No auth required — anyone with the link can click it.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    if (!code || code.length > 8) {
        return NextResponse.json({ error: "Invalid short code" }, { status: 400 });
    }

    // Use service-level client for public access
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Look up the short URL
    const { data: shortUrl, error } = await supabase
        .from("short_urls")
        .select("bookmark_id, click_count")
        .eq("code", code)
        .maybeSingle();

    if (error || !shortUrl) {
        // Redirect to home if not found
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Get the bookmark URL
    const { data: bookmark } = await supabase
        .from("bookmarks")
        .select("url")
        .eq("id", shortUrl.bookmark_id)
        .single();

    if (!bookmark?.url) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Increment click count (fire-and-forget)
    supabase.rpc("increment_short_url_clicks", { short_code: code }).then();

    // 302 redirect to the original URL
    return NextResponse.redirect(bookmark.url, { status: 302 });
}
