// Markly Browser Extension — popup.js
// Version: 3.2 (AI Suggestions + Category Support)

(async function init() {
    console.log("[Markly] Booting Version 3.2...");

    const DASHBOARD_URL = "http://localhost:3000";
    let authToken = null;
    let currentTab = null;
    let metadata = { description: "", image: "" };

    // 1. Helper: Safe Element Access
    const getEl = (id) => {
        const el = document.getElementById(id);
        if (!el) console.warn(`[Markly] Element #${id} not found.`);
        return el;
    };

    // 2. Helper: Safe View Switching
    const showView = (viewName) => {
        try {
            const mv = getEl("mainView");
            const sv = getEl("setupView");

            if (mv) mv.style.display = viewName === "main" ? "block" : "none";
            if (sv) sv.style.display = viewName === "setup" ? "block" : "none";
        } catch (e) {
            console.error("[Markly] showView failed:", e);
        }
    };

    // 3. Helper: Robust Base64 Decoding (Handles Supabase/URL-safe B64)
    const safeAtob = (str) => {
        try {
            let clean = str.replace(/^base64-/, "");
            // Convert URL-safe base64 (- to +, _ to /) and add padding
            clean = clean.replace(/-/g, "+").replace(/_/g, "/");
            while (clean.length % 4 !== 0) clean += "=";
            return atob(clean);
        } catch (e) {
            console.error("[Markly] safeAtob failed:", e);
            return null;
        }
    };

    // 4. Auth Initialization
    async function setupAuth() {
        try {
            const cookies = await chrome.cookies.getAll({ url: DASHBOARD_URL });
            const authCookie = cookies.find(c => c.name.includes("-auth-token"));

            if (authCookie) {
                let rawValue = decodeURIComponent(authCookie.value);
                // CRITICAL: Some browsers/Supabase versions wrap cookie values in double quotes
                rawValue = rawValue.replace(/^"|"$/g, "");

                let jsonValue = rawValue;

                if (rawValue.startsWith("base64-")) {
                    const decoded = safeAtob(rawValue);
                    if (decoded) jsonValue = decoded;
                }

                try {
                    const session = JSON.parse(jsonValue);
                    if (session?.access_token) {
                        authToken = session.access_token;
                        console.log("[Markly] Auth success via cookies.");
                        return;
                    }
                } catch (e) {
                    console.warn("[Markly] JSON parse failed for cookie:", e, jsonValue.substring(0, 30));
                }
            }
        } catch (e) {
            console.error("[Markly] Cookie access error:", e);
        }

        const settings = await chrome.storage.local.get(["sessionToken"]);
        if (settings.sessionToken) {
            authToken = settings.sessionToken;
            console.log("[Markly] Auth loaded from local storage.");
        }
    }

    // 4. AI Suggestions Fetcher
    async function fetchSuggestions(data) {
        if (!authToken) return;
        const container = getEl("aiSuggestions");
        const chipsArea = getEl("suggestionChips");
        if (!container || !chipsArea) return;

        try {
            const settings = await chrome.storage.local.get(["marklyUrl"]);
            const baseUrl = settings.marklyUrl || DASHBOARD_URL;

            const response = await fetch(`${baseUrl}/api/extension/suggest`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const suggestions = await response.json();
                renderSuggestions(suggestions);
                container.style.display = "block";
            }
        } catch (e) {
            console.warn("[Markly] Failed to fetch AI suggestions.");
        }
    }

    function renderSuggestions(s) {
        const chipsArea = getEl("suggestionChips");
        if (!chipsArea) return;
        chipsArea.innerHTML = "";

        // Category Chip (Distinct style)
        if (s.category) {
            const catChip = document.createElement("div");
            catChip.className = "chip category-chip";
            catChip.textContent = s.category;
            catChip.title = "Suggested Category";
            catChip.onclick = () => {
                const catInput = getEl("category");
                if (catInput) catInput.value = s.category;
            };
            chipsArea.appendChild(catChip);
        }

        // Tag Chips
        if (s.tags && Array.isArray(s.tags)) {
            s.tags.forEach(tag => {
                const chip = document.createElement("div");
                chip.className = "chip";
                chip.textContent = tag;
                chip.onclick = () => {
                    const tagsInput = getEl("tags");
                    if (tagsInput) {
                        const existing = tagsInput.value.split(",").map(t => t.trim()).filter(t => t);
                        if (!existing.includes(tag)) {
                            existing.push(tag);
                            tagsInput.value = existing.join(", ");
                        }
                    }
                };
                chipsArea.appendChild(chip);
            });
        }
    }

    // 5. Tab & Metadata Loading
    async function loadTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url) return;

            // Restricted system URLs
            const restricted = ["chrome://", "edge://", "about:", "chrome-extension://", "chrome-error://", "devtools://"];
            if (restricted.some(prefix => tab.url.startsWith(prefix))) {
                const update = (id, text) => { const el = getEl(id); if (el) el.textContent = text; };
                update("pageTitle", "Restricted Page");
                update("hostname", "system");
                const saveBtn = getEl("saveBtn");
                if (saveBtn) {
                    saveBtn.disabled = true;
                    const btnText = getEl("btnText");
                    if (btnText) btnText.textContent = "Cannot Bookmark System Page";
                }
                return;
            }

            currentTab = tab;

            const update = (id, text) => { const el = getEl(id); if (el) el.textContent = text; };
            update("pageTitle", tab.title || "Untitled");

            try {
                const url = new URL(tab.url);
                update("hostname", url.hostname);
                const fav = getEl("favicon");
                if (fav) fav.src = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
            } catch { }

            let results;
            try {
                results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        const getMeta = (names) => {
                            for (let name of names) {
                                const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                                if (el?.content) return el.content;
                            }
                            return "";
                        };

                        // Capture some page content for better AI context
                        const h1 = document.querySelector('h1')?.innerText || "";
                        const paragraphs = Array.from(document.querySelectorAll('p'))
                            .slice(0, 3)
                            .map(p => p.innerText.trim())
                            .filter(t => t.length > 20)
                            .join(" ");

                        return {
                            description: getMeta(["description", "og:description", "twitter:description"]),
                            image: getMeta(["og:image", "twitter:image"]),
                            contentPreview: (h1 + " " + paragraphs).slice(0, 1000)
                        };
                    }
                });
            } catch (scrError) {
                console.warn("[Markly] Scripting failed (likely restricted background page):", scrError);
            }

            if (results?.[0]?.result) {
                metadata = results[0].result;
                const descEl = getEl("pageDescription");
                if (descEl) descEl.value = metadata.description;

                // Trigger AI Suggestions with richer context
                fetchSuggestions({
                    url: tab.url,
                    title: tab.title,
                    description: metadata.description,
                    content: metadata.contentPreview
                });

                // Check if already bookmarked
                checkURL(tab.url);
            }
        } catch (e) {
            console.warn("[Markly] loadTab failed:", e);
        }
    }

    // 6. URL Check
    async function checkURL(url) {
        if (!authToken) return;
        try {
            const resp = await fetch(`${DASHBOARD_URL}/api/extension/check-url`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ url })
            });
            const data = await resp.json();
            if (data.bookmarked) {
                const badge = getEl("bookmarkedBadge");
                if (badge) badge.style.display = "flex";
                const btn = getEl("saveBtn");
                const btnText = getEl("btnText");
                if (btnText) btnText.textContent = "Update Bookmark";
            }
        } catch (e) {
            console.warn("[Markly] checkURL failed:", e);
        }
    }

    // 6. Save Action
    async function onSave() {
        if (!currentTab || !authToken) return;
        const saveBtn = getEl("saveBtn");
        const btnText = getEl("btnText");
        const statusText = getEl("statusText");

        if (saveBtn) saveBtn.disabled = true;
        if (btnText) btnText.textContent = "Saving...";

        try {
            const settings = await chrome.storage.local.get(["marklyUrl"]);
            const baseUrl = settings.marklyUrl || DASHBOARD_URL;
            const desc = getEl("pageDescription")?.value || "";
            const category = getEl("category")?.value || "Uncategorized";
            const tags = getEl("tags")?.value.split(",").map(t => t.trim()).filter(t => t) || [];

            const response = await fetch(`${baseUrl}/api/extension/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify({
                    url: currentTab.url,
                    title: currentTab.title,
                    description: desc,
                    category: category,
                    og_image_url: metadata.image,
                    favicon_url: getEl("favicon")?.src || "",
                    tags: tags
                })
            });

            if (response.ok) {
                if (saveBtn) saveBtn.style.background = "#10b981";
                if (btnText) btnText.innerHTML = "✓ Saved!";
                setTimeout(() => window.close(), 1000);
            } else {
                const err = await response.json();
                throw new Error(err.error || "API Error");
            }
        } catch (e) {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.style.background = "#ef4444"; }
            if (btnText) btnText.textContent = "Retry";
            if (statusText) statusText.textContent = `Error: ${e.message}`;
        }
    }

    // 7. Events
    document.addEventListener("click", async (e) => {
        const id = e.target.id || e.target.closest("[id]")?.id;
        if (!id) return;
        if (id === "saveBtn") onSave();
        if (id === "saveSettingsBtn") {
            const token = getEl("sessionToken")?.value.trim();
            if (!token) return alert("Please enter your session token.");
            const url = getEl("marklyUrl")?.value.trim().replace(/\/+$/, "") || DASHBOARD_URL;
            await chrome.storage.local.set({ marklyUrl: url, sessionToken: token });
            authToken = token;
            showView("main");
            await loadTab();
        }
        if (id === "settingsLink") {
            e.preventDefault();
            chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard` });
        }
    });

    // 7. Interactive UI (Glow & Hover)
    function setupGlow() {
        const btn = getEl("saveBtn");
        if (!btn) return;
        btn.addEventListener("mousemove", (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            btn.style.setProperty("--x", `${x}px`);
            btn.style.setProperty("--y", `${y}px`);
        });
    }

    // 8. Bootstrap
    try {
        await setupAuth();
        if (authToken) {
            showView("main");
            setupGlow();

            // Display user info
            try {
                const sessionData = await chrome.storage.local.get("supabase.auth.token");
                const tokenObj = sessionData?.["supabase.auth.token"];
                if (tokenObj?.user?.email) {
                    const emailEl = getEl("userEmail");
                    if (emailEl) emailEl.textContent = tokenObj.user.email;
                }
            } catch (e) {
                console.warn("[Markly] Failed to load user email:", e);
            }

            await loadTab();
        } else {
            showView("setup");
        }
    } catch (e) {
        console.error("[Markly] Bootstrap failed:", e);
    }
})();
