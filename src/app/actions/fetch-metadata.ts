"use server";

import * as cheerio from "cheerio";

export interface SiteMetadata {
    title: string;
    description: string;
    favicon_url: string;
    og_image_url: string;
}

/**
 * Server action: Fetch metadata from a URL.
 * Runs on the server so it avoids CORS issues.
 */
export async function fetchUrlMetadata(url: string): Promise<SiteMetadata> {
    const result: SiteMetadata = {
        title: "",
        description: "",
        favicon_url: "",
        og_image_url: "",
    };

    try {
        // Validate URL
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return result;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
        });

        clearTimeout(timeout);

        if (!res.ok) return result;

        // Check content type
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
            return result;
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // 1. Title
        result.title =
            $('meta[property="og:title"]').attr("content") ||
            $('meta[name="twitter:title"]').attr("content") ||
            $("title").text() ||
            $("h1").first().text() ||
            "";

        // 2. Description
        result.description =
            $('meta[property="og:description"]').attr("content") ||
            $('meta[name="description"]').attr("content") ||
            $('meta[name="twitter:description"]').attr("content") ||
            "";

        // 3. OG Image
        result.og_image_url =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content") ||
            "";

        // 4. Favicon
        // Try multiple selectors for favicon
        let faviconHref =
            $('link[rel="apple-touch-icon"]').attr("href") ||
            $('link[rel="icon"]').attr("href") ||
            $('link[rel="shortcut icon"]').attr("href") ||
            "";

        // Helper to resolve relative URLs
        const resolveUrl = (href: string) => {
            try {
                return new URL(href, url).toString();
            } catch {
                return "";
            }
        };

        if (faviconHref) {
            result.favicon_url = resolveUrl(faviconHref);
        } else {
            // Fallback to /favicon.ico at origin
            result.favicon_url = new URL("/favicon.ico", parsed.origin).toString();
        }

        if (result.og_image_url) {
            result.og_image_url = resolveUrl(result.og_image_url);
        }

        // Cleanup
        result.title = result.title.trim().slice(0, 200);
        result.description = result.description.trim().slice(0, 500);

        // 5. AI Fallback for missing title/description
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey && (!result.title || !result.description)) {
            try {
                const prompt = `You are a web metadata extractor. Given the URL "${url}" and the following partially fetched content:
                Title: ${result.title || "Unknown"}
                Description: ${result.description || "Unknown"}
                
                Please provide a better title and a concise description (1-2 sentences) for this webpage. 
                Respond ONLY with a JSON object: {"title": "...", "description": "..."}`;

                const res = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.3,
                        max_tokens: 200,
                        response_format: { type: "json_object" }
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = JSON.parse(data.choices?.[0]?.message?.content || "{}");
                    if (!result.title && content.title) result.title = content.title.trim().slice(0, 200);
                    if (!result.description && content.description) result.description = content.description.trim().slice(0, 500);
                }
            } catch (e) {
                console.error("AI Metadata fallback error:", e);
            }
        }

    } catch (error) {
        console.error("Error fetching metadata:", error);
    }

    return result;
}
