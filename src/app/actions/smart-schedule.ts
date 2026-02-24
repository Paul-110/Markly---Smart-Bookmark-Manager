"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReminderType = "later-today" | "tomorrow" | "weekend" | "next-week" | "smart";

export async function scheduleReminder(bookmarkId: string, type: ReminderType) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let reminderDate = new Date();

    // Simple offsets
    if (type === "later-today") {
        reminderDate.setHours(reminderDate.getHours() + 4);
    } else if (type === "tomorrow") {
        reminderDate.setDate(reminderDate.getDate() + 1);
        reminderDate.setHours(9, 0, 0, 0); // 9 AM
    } else if (type === "weekend") {
        // Find next Saturday
        const day = reminderDate.getDay();
        const daysUntilWeekend = day === 6 ? 7 : (6 - day); // If Sat, wait a week? Or next day? 
        // Let's say next Saturday.
        reminderDate.setDate(reminderDate.getDate() + daysUntilWeekend);
        reminderDate.setHours(10, 0, 0, 0); // 10 AM
    } else if (type === "next-week") {
        // Next Monday
        const day = reminderDate.getDay();
        const daysUntilMonday = (8 - day) % 7 || 7;
        reminderDate.setDate(reminderDate.getDate() + daysUntilMonday);
        reminderDate.setHours(9, 0, 0, 0);
    } else if (type === "smart") {
        // Fetch bookmark details
        const { data: bookmark } = await supabase
            .from("bookmarks")
            .select("category, tags")
            .eq("id", bookmarkId)
            .single();

        if (bookmark) {
            const cat = (bookmark.category || "").toLowerCase();
            const tags = (bookmark.tags || []).join(" ").toLowerCase();

            if (cat.includes("food") || cat.includes("recipe") || tags.includes("cook")) {
                // Weekend Morning
                const day = reminderDate.getDay();
                const daysUntilWeekend = day === 6 ? 7 : (6 - day);
                reminderDate.setDate(reminderDate.getDate() + daysUntilWeekend);
                reminderDate.setHours(9, 30, 0, 0);
            } else if (cat.includes("work") || cat.includes("tech") || cat.includes("program")) {
                // Weekday Morning
                const day = reminderDate.getDay();
                if (day === 0 || day === 6) { // Weekend -> Monday
                    const daysUntilMonday = (8 - day) % 7 || 7;
                    reminderDate.setDate(reminderDate.getDate() + daysUntilMonday);
                } else {
                    // Weekday -> Tomorrow
                    reminderDate.setDate(reminderDate.getDate() + 1);
                }
                reminderDate.setHours(9, 0, 0, 0);
            } else if (cat.includes("entertainment") || cat.includes("movie") || cat.includes("video")) {
                // Tonight or Weekend Evening
                if (reminderDate.getHours() < 18) {
                    reminderDate.setHours(20, 0, 0, 0); // 8 PM tonight
                } else {
                    reminderDate.setDate(reminderDate.getDate() + 1);
                    reminderDate.setHours(20, 0, 0, 0); // 8 PM tomorrow
                }
            } else {
                // Default: Tomorrow Morning
                reminderDate.setDate(reminderDate.getDate() + 1);
                reminderDate.setHours(9, 0, 0, 0);
            }
        }
    }

    const isoString = reminderDate.toISOString();

    const { error } = await supabase
        .from("bookmarks")
        .update({ reminder_at: isoString })
        .eq("id", bookmarkId)
        .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true, date: isoString };
}
