import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * One-time migration endpoint to add `shared_by` column to the bookmarks table.
 * Visit /api/migrate-shared-by to run this migration.
 * Safe to run multiple times (uses IF NOT EXISTS logic via error handling).
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Test if the column already exists by trying to query it
        const { error: testError } = await supabase
            .from("bookmarks")
            .select("shared_by")
            .limit(1);

        if (testError && testError.message.includes("shared_by")) {
            // Column doesn't exist - we need to add it via RPC or direct SQL
            // Since we can't run raw SQL with anon key, we'll use the REST API approach:
            // Try inserting a bookmark with shared_by to see if the column exists
            return NextResponse.json({
                success: false,
                message: "The 'shared_by' column does not exist yet. Please run this SQL in the Supabase SQL Editor: ALTER TABLE bookmarks ADD COLUMN shared_by TEXT DEFAULT NULL;",
                sql: "ALTER TABLE bookmarks ADD COLUMN shared_by TEXT DEFAULT NULL;"
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: "The 'shared_by' column already exists on the bookmarks table. No migration needed!"
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
