"use server";
import { askAI } from "@/lib/ai/ai-provider";

import type { Bookmark } from "@/types/bookmark";

export async function generateAIInsights(bookmarks: Bookmark[]) {
    const hasAI = process.env.OPENAI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!hasAI || bookmarks.length === 0) return null;

    // Summarize data for AI to stay within token limits and privacy
    const stats = {
        total: bookmarks.length,
        categories: {} as Record<string, number>,
        tags: {} as Record<string, number>,
        recentTitles: bookmarks.slice(0, 10).map(b => b.title),
    };

    bookmarks.forEach(b => {
        if (b.category) stats.categories[b.category] = (stats.categories[b.category] || 0) + 1;
        b.tags.forEach(t => {
            stats.tags[t] = (stats.tags[t] || 0) + 1;
        });
    });

    const categorySummary = Object.entries(stats.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `${name} (${count})`)
        .join(", ");

    const tagSummary = Object.entries(stats.tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => `${name} (${count})`)
        .join(", ");

    const prompt = `You are an AI data analyst for "Markly", a smart bookmark manager. 
    Analyze these user library stats and provide 3 unique, friendly, and actionable insights.
    
    Stats:
    - Total Bookmarks: ${stats.total}
    - Top Categories: ${categorySummary || "None yet"}
    - Top Tags: ${tagSummary || "None yet"}
    - Recently Saved: ${stats.recentTitles.join(", ")}
    
    Example Insights:
    - "You're a research machine! You've saved 15 AI papers this week. Time for a 'Deep Learning' collection?"
    - "Digital hoarder alert? You have 50 uncategorized bookmarks. Let's tidy them up!"
    - "Productivity pro: Your most visited links are all related to Trello and Notion."
    
    Respond ONLY with a JSON object: {"insights": ["insight1", "insight2", "insight3"]}`;

    try {
        const content = await askAI(prompt, {
            temperature: 0.8,
            maxTokens: 400,
            responseFormat: "json"
        });

        if (content) {
            const parsed = JSON.parse(content);
            return parsed.insights || [];
        }
    } catch (e) {
        console.error("AI Insights error:", e);
    }
    return null;
}
