import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public API endpoint for the browser extension to save bookmarks
// Auth: Bearer token (Supabase access_token from the user session)
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];

        // Create a Supabase client with the user's access token
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: { Authorization: `Bearer ${token}` },
                },
            }
        );

        // Verify user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid or expired session token" }, { status: 401 });
        }

        const body = await request.json();
        const { url, title, category, favicon_url, description, og_image_url } = body;

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Check for existing bookmark to determine if we should update
        const { data: existing } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("url", url)
            .eq("user_id", user.id)
            .maybeSingle();

        let bookmarkId: string;
        if (existing) {
            // Update existing
            const { data, error } = await supabase
                .from("bookmarks")
                .update({
                    title: title || "Untitled",
                    description: description || null,
                    category: category || "Uncategorized",
                    favicon_url: favicon_url || null,
                    og_image_url: og_image_url || null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", existing.id)
                .select("id")
                .single();
            if (error) throw error;
            bookmarkId = data.id;
        } else {
            // Insert new
            const { data, error } = await supabase
                .from("bookmarks")
                .insert({
                    url,
                    title: title || "Untitled",
                    description: description || null,
                    category: category || "Uncategorized",
                    favicon_url: favicon_url || null,
                    og_image_url: og_image_url || null,
                    user_id: user.id,
                })
                .select("id")
                .single();
            if (error) throw error;
            bookmarkId = data.id;
        }

        // Trigger AI processing in the background (Non-blocking for extension speed)
        try {
            const { summarizeBookmark } = await import("@/app/actions/ai-analyze");

            // We don't await this to keep the extension response snappy
            summarizeBookmark(bookmarkId).catch(err => {
                console.error("Background AI summarization failed:", err);
            });
        } catch (aiErr) {
            console.warn("AI trigger failed (non-critical):", aiErr);
        }

        return NextResponse.json({ message: existing ? "Bookmark updated!" : "Bookmark saved!", id: bookmarkId }, { status: 201 });
    } catch (err) {
        console.error("Extension API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
