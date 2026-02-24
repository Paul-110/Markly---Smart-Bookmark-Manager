"use server";
import { askAI } from "@/lib/ai/ai-provider";

export interface AISuggestions {
    category: string;
    tags: string[];
    confidence: "high" | "medium" | "low";
}

/**
 * Server action: Suggest category and tags for a bookmark using AI.
 *
 * Uses OpenAI if OPENAI_API_KEY is set in .env.local,
 * otherwise falls back to intelligent rule-based categorization.
 */
export async function suggestCategoryAndTags(input: {
    url: string;
    title: string;
    description: string;
}): Promise<AISuggestions> {
    const hasAI = process.env.OPENAI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

    if (hasAI) {
        return suggestWithAI(input);
    }

    return suggestWithRules(input);
}

// ─── OpenAI-powered suggestions ────────────────────────────────

async function suggestWithAI(
    input: { url: string; title: string; description: string }
): Promise<AISuggestions> {
    try {
        const prompt = `You are a bookmark categorization assistant. Given a webpage's URL, title, and description, suggest:
1. ONE category (single word or short phrase)
2. 3-5 relevant tags (short, lowercase keywords)

Respond ONLY with valid JSON in this exact format:
{"category":"CategoryName","tags":["tag1","tag2","tag3"]}

URL: ${input.url}
Title: ${input.title}
Description: ${input.description || "N/A"}`;

        const content = await askAI(prompt, {
            temperature: 0.3,
            maxTokens: 200,
            responseFormat: "json"
        });

        if (!content) return suggestWithRules(input);

        // Parse JSON safely
        const jsonStr = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(jsonStr);

        return {
            category: String(parsed.category || "").slice(0, 50),
            tags: (Array.isArray(parsed.tags) ? parsed.tags : [])
                .map((t: unknown) => String(t).toLowerCase().trim())
                .filter(Boolean)
                .slice(0, 6),
            confidence: "high",
        };
    } catch (error) {
        console.error("AI suggestion error:", error);
        return suggestWithRules(input);
    }
}

// ─── Rule-based fallback ───────────────────────────────────────

interface CategoryRule {
    category: string;
    domains: string[];
    keywords: string[];
    tags: string[];
}

const RULES: CategoryRule[] = [
    {
        category: "Programming",
        domains: ["github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com", "npmjs.com", "pypi.org", "crates.io", "pkg.go.dev", "dev.to", "hashnode.dev", "codepen.io", "replit.com", "codesandbox.io", "leetcode.com", "hackerrank.com"],
        keywords: ["code", "programming", "developer", "software", "api", "framework", "library", "sdk", "typescript", "javascript", "python", "rust", "java", "react", "nextjs", "angular", "vue", "node", "deno", "git", "docker", "kubernetes", "devops", "ci/cd", "compiler", "algorithm", "data structure", "open source", "repository", "pull request", "commit"],
        tags: ["development", "code", "programming"],
    },
    {
        category: "AI/ML",
        domains: ["openai.com", "huggingface.co", "kaggle.com", "tensorflow.org", "pytorch.org", "anthropic.com", "deepmind.com", "arxiv.org", "papers.nips.cc", "midjourney.com"],
        keywords: ["artificial intelligence", "machine learning", "deep learning", "neural network", "gpt", "llm", "transformer", "nlp", "natural language", "computer vision", "generative ai", "diffusion", "chatbot", "prompt engineering"],
        tags: ["ai", "machine-learning", "deep-learning"],
    },
    {
        category: "Design",
        domains: ["dribbble.com", "behance.net", "figma.com", "canva.com", "sketch.com", "adobe.com", "unsplash.com", "pexels.com", "awwwards.com", "designspiration.com", "fonts.google.com", "coolors.co"],
        keywords: ["design", "ui", "ux", "typography", "color", "layout", "wireframe", "prototype", "mockup", "illustration", "graphic", "branding", "logo", "font", "icon", "css", "tailwind", "animation", "figma"],
        tags: ["design", "ui-ux", "creative"],
    },
    {
        category: "News",
        domains: ["bbc.com", "cnn.com", "nytimes.com", "theguardian.com", "reuters.com", "apnews.com", "aljazeera.com", "washingtonpost.com", "techcrunch.com", "theverge.com", "arstechnica.com", "wired.com", "engadget.com"],
        keywords: ["news", "breaking", "report", "headline", "journalism", "press", "media", "article", "editorial", "opinion"],
        tags: ["news", "media", "current-events"],
    },
    {
        category: "Education",
        domains: ["coursera.org", "udemy.com", "edx.org", "khanacademy.org", "udacity.com", "pluralsight.com", "skillshare.com", "codecademy.com", "freecodecamp.org", "w3schools.com", "mdn.io", "developer.mozilla.org", "docs.google.com", "notion.so", "wikipedia.org", "scholar.google.com"],
        keywords: ["learn", "tutorial", "course", "education", "training", "academy", "lesson", "lecture", "study", "teach", "guide", "documentation", "docs", "wiki", "reference", "how to", "beginner", "advanced"],
        tags: ["education", "learning", "tutorial"],
    },
    {
        category: "Social Media",
        domains: ["twitter.com", "x.com", "facebook.com", "instagram.com", "linkedin.com", "reddit.com", "tiktok.com", "mastodon.social", "threads.net", "discord.com", "slack.com", "pinterest.com"],
        keywords: ["social", "post", "tweet", "follow", "profile", "community", "forum", "discussion", "thread"],
        tags: ["social-media", "community"],
    },
    {
        category: "Entertainment",
        domains: ["youtube.com", "youtu.be", "netflix.com", "twitch.tv", "spotify.com", "soundcloud.com", "imdb.com", "rottentomatoes.com", "hulu.com", "disneyplus.com", "primevideo.com", "crunchyroll.com"],
        keywords: ["video", "movie", "film", "music", "song", "podcast", "stream", "watch", "play", "entertainment", "show", "series", "anime", "trailer"],
        tags: ["entertainment", "media"],
    },
    {
        category: "Finance",
        domains: ["bloomberg.com", "yahoo.com/finance", "investopedia.com", "coindesk.com", "binance.com", "robinhood.com", "stripe.com", "paypal.com", "wise.com"],
        keywords: ["finance", "stock", "invest", "crypto", "bitcoin", "ethereum", "market", "trading", "bank", "money", "payment", "fintech", "budget", "tax", "economy"],
        tags: ["finance", "investing"],
    },
    {
        category: "Shopping",
        domains: ["amazon.com", "ebay.com", "etsy.com", "shopify.com", "walmart.com", "aliexpress.com", "target.com", "bestbuy.com"],
        keywords: ["shop", "buy", "price", "deal", "discount", "sale", "product", "review", "order", "cart", "store", "ecommerce"],
        tags: ["shopping", "ecommerce"],
    },
    {
        category: "Technology",
        domains: ["apple.com", "microsoft.com", "google.com", "aws.amazon.com", "cloud.google.com", "azure.microsoft.com", "vercel.com", "netlify.com", "heroku.com", "digitalocean.com", "cloudflare.com"],
        keywords: ["technology", "tech", "gadget", "hardware", "software", "startup", "saas", "cloud", "server", "platform", "app", "mobile", "web", "browser", "cybersecurity", "privacy"],
        tags: ["technology", "tech"],
    },
    {
        category: "Health",
        domains: ["webmd.com", "healthline.com", "mayoclinic.org", "nih.gov", "who.int", "medlineplus.gov"],
        keywords: ["health", "medical", "wellness", "fitness", "exercise", "diet", "nutrition", "mental health", "therapy", "doctor", "symptom", "disease"],
        tags: ["health", "wellness"],
    },
    {
        category: "Science",
        domains: ["nature.com", "sciencedirect.com", "researchgate.net", "pubmed.ncbi.nlm.nih.gov", "nasa.gov", "space.com"],
        keywords: ["science", "research", "study", "experiment", "physics", "chemistry", "biology", "astronomy", "space", "climate", "environment", "sustainability"],
        tags: ["science", "research"],
    },
    {
        category: "Travel",
        domains: ["tripadvisor.com", "booking.com", "airbnb.com", "expedia.com", "lonelyplanet.com", "skyscanner.com", "kayak.com"],
        keywords: ["travel", "trip", "flight", "hotel", "vacation", "destination", "tourism", "adventure", "explore", "booking"],
        tags: ["travel", "tourism"],
    },
    {
        category: "Gaming",
        domains: ["store.steampowered.com", "epicgames.com", "ign.com", "gamespot.com", "kotaku.com", "polygon.com", "playstation.com", "xbox.com", "nintendo.com"],
        keywords: ["game", "gaming", "esports", "playstation", "xbox", "nintendo", "steam", "pc gaming", "console", "rpg", "fps", "mmo"],
        tags: ["gaming", "games"],
    },
    {
        category: "Food",
        domains: ["allrecipes.com", "foodnetwork.com", "epicurious.com", "seriouseats.com", "bonappetit.com", "tasty.co"],
        keywords: ["recipe", "cook", "food", "restaurant", "cuisine", "meal", "ingredient", "bake", "chef", "kitchen", "dinner", "lunch", "breakfast"],
        tags: ["food", "recipes", "cooking"],
    },
];

function suggestWithRules(input: { url: string; title: string; description: string }): AISuggestions {
    const text = `${input.url} ${input.title} ${input.description}`.toLowerCase();

    let hostname = "";
    try {
        hostname = new URL(input.url).hostname.replace(/^www\./, "");
    } catch { /* invalid URL */ }

    let bestMatch: { category: string; tags: string[]; score: number } = {
        category: "General",
        tags: [],
        score: 0,
    };

    for (const rule of RULES) {
        let score = 0;

        // Domain match is a strong signal
        if (rule.domains.some((d) => hostname.includes(d) || d.includes(hostname))) {
            score += 10;
        }

        // Keyword matches
        for (const kw of rule.keywords) {
            if (text.includes(kw)) score += 1;
        }

        if (score > bestMatch.score) {
            bestMatch = { category: rule.category, tags: [...rule.tags], score };
        }
    }

    // Extract additional tags from title
    const titleWords = input.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    // Add up to 2 extra tags from title
    const extraTags = titleWords
        .filter((w) => !bestMatch.tags.includes(w))
        .slice(0, 2);

    const allTags = [...bestMatch.tags, ...extraTags].slice(0, 5);

    return {
        category: bestMatch.category,
        tags: allTags,
        confidence: bestMatch.score >= 10 ? "high" : bestMatch.score >= 3 ? "medium" : "low",
    };
}

const STOP_WORDS = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
    "her", "was", "one", "our", "out", "has", "have", "this", "that", "with",
    "they", "been", "from", "will", "each", "make", "like", "long", "look",
    "many", "more", "most", "much", "must", "name", "only", "over", "such",
    "take", "than", "them", "then", "very", "when", "come", "could", "just",
    "about", "other", "into", "some", "what", "your", "said", "also", "which",
    "their", "were", "being", "would", "there", "these", "those", "after",
    "https", "http", "www", "com", "org", "net", "page", "home", "best",
    "free", "online", "website", "official", "welcome",
]);
