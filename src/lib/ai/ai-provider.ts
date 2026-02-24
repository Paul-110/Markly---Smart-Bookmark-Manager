import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider = "openai" | "gemini" | "deepseek";

interface AIRequestOptions {
    provider?: AIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "text" | "json";
    timeoutMs?: number;
}

/**
 * Higher-level AI call that handles fallback between providers.
 */
export async function askAI(prompt: string, options: AIRequestOptions = {}) {
    const preferredProvider = (process.env.PREFERRED_AI_PROVIDER as AIProvider) || "openai";
    const openAIKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    // Default timeout: 12s per provider
    const timeout = options.timeoutMs ?? 12000;

    // Build the provider chain starting with the preferred one
    const allProviders: AIProvider[] = ["openai", "gemini", "deepseek"];
    const startProvider = options.provider || preferredProvider;
    const providers: AIProvider[] = [
        startProvider,
        ...allProviders.filter(p => p !== startProvider)
    ];

    const errors: { provider: AIProvider; message: string; isRateLimit: boolean }[] = [];
    const availableProviders = providers.filter(p => {
        if (p === "openai") return !!openAIKey;
        if (p === "gemini") return !!geminiKey;
        if (p === "deepseek") return !!deepseekKey;
        return false;
    });

    if (availableProviders.length === 0) {
        throw new Error("No AI providers configured. Please add API keys to .env.local");
    }

    for (const provider of availableProviders) {
        try {
            if (provider === "openai" && openAIKey) {
                console.log(`[AI] Attempting OpenAI...`);
                return await callOpenAI(openAIKey, prompt, { ...options, timeoutMs: timeout });
            }
            if (provider === "gemini" && geminiKey) {
                console.log(`[AI] Attempting Gemini...`);
                return await callGemini(geminiKey, prompt, { ...options, timeoutMs: timeout });
            }
            if (provider === "deepseek" && deepseekKey) {
                console.log(`[AI] Attempting DeepSeek...`);
                return await callDeepSeek(deepseekKey, prompt, { ...options, timeoutMs: timeout });
            }
        } catch (error: any) {
            const msg = error.message.toLowerCase();
            const isRateLimit = msg.includes("429") || msg.includes("rate limit") || msg.includes("quota");
            console.warn(`[AI] ${provider} failed${isRateLimit ? " (Rate Limit)" : ""}: ${error.message}`);
            errors.push({ provider, message: error.message, isRateLimit });

            // If it's a rate limit, we immediately try the NEXT provider in the chain
            // No need to wait as the next provider likely has fresh quota
            continue;
        }
    }

    // If we reach here, ALL configured providers failed
    const hasAnyRateLimit = errors.some(e => e.isRateLimit);
    const details = errors.map(e => `${e.provider}: ${e.message}`).join(" | ");

    if (hasAnyRateLimit) {
        throw new Error(`AI_RATE_LIMIT: All providers are busy. ${details}`);
    }

    throw new Error(`All AI providers failed. Details: ${details}`);
}

async function callOpenAI(apiKey: string, prompt: string, options: AIRequestOptions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: options.model || "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: options.temperature ?? 0.3,
                max_tokens: options.maxTokens ?? 500,
                response_format: options.responseFormat === "json" ? { type: "json_object" } : undefined,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${res.status} ${JSON.stringify(err)}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || "";
    } finally {
        clearTimeout(timeout);
    }
}

async function callDeepSeek(apiKey: string, prompt: string, options: AIRequestOptions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: options.model || "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: options.temperature ?? 0.3,
                max_tokens: options.maxTokens ?? 500,
                // DeepSeek supports response_format but it might differ slightly, using standard OpenAI format
                response_format: options.responseFormat === "json" ? { type: "json_object" } : undefined,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`DeepSeek API error: ${res.status} ${JSON.stringify(err)}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || "";
    } finally {
        clearTimeout(timeout);
    }
}

async function callGemini(apiKey: string, prompt: string, options: AIRequestOptions) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // v1beta often has better support for newer features like responseMimeType in Gemini 2.0
    const model = genAI.getGenerativeModel({
        model: options.model || "gemini-2.0-flash",
    }, { apiVersion: "v1beta" });

    const generationConfig = {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 500,
        ...(options.responseFormat === "json" ? { responseMimeType: "application/json" } : {}),
    };

    // Gemini doesn't have a direct timeout in simple generateContent, so we wrap it
    return new Promise<string>(async (resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Gemini request timed out")), options.timeoutMs);
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig,
            });
            const response = await result.response;
            clearTimeout(timeout);
            resolve(response.text().trim());
        } catch (error: any) {
            clearTimeout(timeout);

            // Fallback: If 400 error about responseMimeType, try again without it
            if (error.message?.includes("responseMimeType") || error.message?.includes("400")) {
                console.warn("Gemini rejected responseMimeType or returned 400, retrying without specific format...");
                try {
                    const result = await model.generateContent({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: options.temperature ?? 0.3,
                            maxOutputTokens: options.maxTokens ?? 500,
                        },
                    });
                    const response = await result.response;
                    return resolve(response.text().trim());
                } catch (retryError) {
                    return reject(retryError);
                }
            }

            reject(error);
        }
    });
}
