"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { askAI } from "@/lib/ai/ai-provider";

/**
 * Summarize a bookmark's content
 */
export async function summarizeBookmark(bookmarkId: string, force: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if summaries are disabled for this user
    if (user.user_metadata?.ai_summaries === false && !force) {
        return { summary: null };
    }

    // 1. Fetch bookmark
    const { data: bookmark, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("id", bookmarkId)
        .eq("user_id", user.id)
        .single();

    if (error || !bookmark) throw new Error("Bookmark not found");

    // Check if already summarized unless forced
    if (bookmark.ai_summary && !force) return { summary: bookmark.ai_summary };

    // 2. Generate Summary
    let summary = "";

    try {
        const context = `Title: ${bookmark.title}\nDescription: ${bookmark.description}\nURL: ${bookmark.url}`;
        const prompt = `Summarize the content of this webpage in 2-3 concise sentences based on the metadata below. Focus on the main topic/value for a user saving this bookmark.\n\n${context}`;

        // Use user's preferred provider if set
        const provider = user.user_metadata?.ai_provider;

        summary = await askAI(prompt, {
            temperature: 0.3,
            maxTokens: 150,
            ...(provider ? { provider } : {}) // Note: need to update askAI options if I want to force provider
        });

        if (!summary) throw new Error("AI returned empty result");
        console.log("Summary generated successfully via AI provider");
    } catch (e: any) {
        console.error("AI Generation error:", e.message);
        if (force) {
            if (e.message.includes("AI_RATE_LIMIT") || e.message.includes("429") || e.message.includes("rate limit")) {
                throw new Error("AI is currently busy (Rate Limit reached on all providers). Please try again in a minute.");
            }
            throw e;
        }
    }

    // 3. Save Summary ONLY if we actually got something new or AI succeeded
    if (summary) {
        await supabase.from("bookmarks").update({ ai_summary: summary }).eq("id", bookmarkId);
    } else {
        // Fallback for UI but DON'T save to DB so we can try again
        summary = bookmark.description || "No summary available. (AI failed to process)";
    }

    revalidatePath("/dashboard");
    return { summary };
}

/**
 * Suggest collections based on existing bookmarks
 */
export async function suggestCollections() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Fetch all user bookmarks
    const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("id, title, description, url, tags, category")
        .eq("user_id", user.id)
        .limit(100); // Limit context size

    if (!bookmarks || bookmarks.length < 3) {
        return []; // Not enough data
    }

    const hasAI = process.env.OPENAI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (hasAI) {
        try {
            const prompt = `You are a bookmark organization assistant. Given the following list of bookmarks, suggest 3-5 logical collections (folders) to group them.
        
        Bookmarks:
        ${bookmarks.map((b, i) => `${i + 1}. [${b.id}] ${b.title} (${b.category}, tags: ${b.tags.join(",")})`).join("\n")}
        
        Respond ONLY with a valid JSON array of objects:
        [
            {
            "name": "Collection Name",
            "description": "Short description of why these are grouped",
            "bookmark_ids": ["uuid1", "uuid2"]
            }
        ]
        Include at least 2 bookmarks per collection. Do not force bookmarks into collections if they don't fit.`;

            // Use user's preferred provider if set
            const provider = user.user_metadata?.ai_provider;

            const content = await askAI(prompt, {
                temperature: 0.3,
                maxTokens: 1000,
                responseFormat: "json",
                ...(provider ? { provider } : {})
            });

            if (content) {
                const parsed = JSON.parse(content);
                const collections = Array.isArray(parsed) ? parsed : (parsed.collections || []);
                return collections;
            }
        } catch (e) {
            console.error("AI collection suggestion error:", e);
        }
    }

    // Fallback: Group by Category
    const byCategory: Record<string, string[]> = {};
    bookmarks.forEach(b => {
        if (b.category) {
            if (!byCategory[b.category]) byCategory[b.category] = [];
            byCategory[b.category].push(b.id);
        }
    });

    const suggestions = Object.entries(byCategory)
        .filter(([_, ids]) => ids.length >= 2)
        .map(([cat, ids]) => ({
            name: cat,
            description: `Auto-grouped based on category "${cat}"`,
            bookmark_ids: ids,
        }))
        .slice(0, 5);

    return suggestions;
}
