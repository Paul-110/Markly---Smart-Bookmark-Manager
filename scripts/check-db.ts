
import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Load env from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} else {
    console.warn(".env.local not found");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log("Checking database tables...");

    // Check bookmarks (should exist)
    const { error: bookmarksError } = await supabase.from('bookmarks').select('id').limit(1);
    // bookmarks might be empty, check specific error like "relation does not exist"
    if (bookmarksError && bookmarksError.code === "42P01") {
        console.log("Bookmarks table MISSING (Migration 001 missing?)");
    } else if (bookmarksError) {
        console.log("Bookmarks table check error:", bookmarksError.message);
    } else {
        console.log("Bookmarks table exists.");
    }

    // Check visit_logs (from 004_analytics.sql)
    const { error: logsError } = await supabase.from('visit_logs').select('id').limit(1);
    if (logsError && logsError.code === "42P01") {
        console.log("Visit logs table MISSING (Migration 004 missing!)");
    } else if (logsError) {
        console.log("Visit logs table check error:", logsError.message);
    } else {
        console.log("Visit logs table exists (Migration 004 applied).");
    }

    // Check ai_suggested_collections (from 003_ai_enhancements.sql)
    const { error: aiError } = await supabase.from('ai_suggested_collections').select('id').limit(1);
    if (aiError && aiError.code === "42P01") {
        console.log("AI Suggested Collections table MISSING (Migration 003 missing!)");
    } else if (aiError) {
        console.log("AI Suggested Collections check error:", aiError.message);
    } else {
        console.log("AI Suggested Collections table exists (Migration 003 applied).");
    }
}

checkTables();
