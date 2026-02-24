import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askAI } from "@/lib/ai/ai-provider";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
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
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const { url, title, description, content: pageContent } = await request.json();

        const prompt = `You are a bookmark organization assistant. Given the following page metadata and content preview, suggest 4-6 relevant tags and one specific category (e.g., "Technology", "Recipes", "Productivity", "Education", "Entertainment", "Finance").
        
        Title: ${title}
        Description: ${description}
        URL: ${url}
        Content Preview: ${pageContent || "N/A"}
        
        Respond ONLY with a valid JSON object:
        {
            "tags": ["tag1", "tag2", "tag3", "tag4"],
            "category": "Category Name"
        }`;

        // Use user's preferred provider if set
        const provider = user.user_metadata?.ai_provider;

        const content = await askAI(prompt, {
            temperature: 0.3,
            maxTokens: 300,
            responseFormat: "json",
            ...(provider ? { provider } : {})
        });

        if (!content) {
            throw new Error("AI returned empty result");
        }

        const suggestions = JSON.parse(content);
        return NextResponse.json(suggestions);

    } catch (err: any) {
        console.error("Suggestion API error:", err);
        return NextResponse.json({ error: err.message || "Failed to get suggestions" }, { status: 500 });
    }
}
