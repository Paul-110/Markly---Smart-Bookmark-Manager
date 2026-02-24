# Markly Browser Extension 🧩

A Chrome extension to quickly save the current tab as a bookmark to your Markly instance.

## Features

- **One-click save** — Save any tab to Markly instantly
- **Category selection** — Categorize on the fly or let Markly auto-detect
- **Duplicate detection** — Won't save the same URL twice
- **Session-based auth** — Uses your Supabase session token

## Setup

### 1. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `markly-extension/` folder
5. The Markly icon should appear in your toolbar

### 2. Connect to Markly

1. Click the Markly extension icon
2. Enter your **Markly URL** (e.g., `http://localhost:3000` for local dev)
3. Enter your **Session Token**:
   - Open Markly in your browser
   - Open DevTools → Application → Local Storage → your Supabase URL
   - Copy the `access_token` value from the session entry
4. Click **Connect**

### 3. Usage

1. Navigate to any page you want to save
2. Click the Markly extension icon
3. Optionally select a category
4. Click **Save to Markly**

## Technical Details

- **Manifest V3** Chrome extension
- Communicates with `/api/extension/save` endpoint on your Markly instance
- Uses `chrome.storage.local` for settings persistence
- Auth via Supabase `access_token` (Bearer token)
