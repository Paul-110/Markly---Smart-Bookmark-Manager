"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Imports a shared collection into the user's personal collections.
 * Clones the collection metadata and creates new bookmark records for the user.
 */
export async function importCollection(sharedCollectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized: You must be logged in to import collections." };
    }

    // 1. Fetch the shared collection details
    const { data: sourceCol, error: colError } = await supabase
        .from("collections")
        .select("*")
        .eq("id", sharedCollectionId)
        .single();

    if (colError || !sourceCol) {
        return { error: "Failed to find the shared collection." };
    }

    // 2. Fetch the bookmarks associated with this collection
    const { data: colBookmarks, error: cbError } = await supabase
        .from("collection_bookmarks")
        .select("bookmark_id, order_index")
        .eq("collection_id", sharedCollectionId);

    if (cbError) {
        return { error: "Failed to fetch collection bookmarks." };
    }

    const sourceBookmarkIds = (colBookmarks || []).map(cb => cb.bookmark_id);

    // 3. Create a new collection for the current user
    const { data: newCol, error: createError } = await supabase
        .from("collections")
        .insert({
            user_id: user.id,
            name: `${sourceCol.name} (Imported)`,
            description: sourceCol.description,
            is_public: false,
        })
        .select("id")
        .single();

    if (createError || !newCol) {
        return { error: `Failed to create collection: ${createError?.message}` };
    }

    // Add owner as member
    await supabase.from("collection_members").insert({
        collection_id: newCol.id,
        user_id: user.id,
        role: "owner",
    });

    if (sourceBookmarkIds.length > 0) {
        // 4. Fetch full bookmark data
        const { data: sourceBookmarks, error: fetchError } = await supabase
            .from("bookmarks")
            .select("*")
            .in("id", sourceBookmarkIds);

        if (fetchError || !sourceBookmarks) {
            return { error: "Failed to fetch bookmark data." };
        }

        // 5. Create new bookmarks for the user
        const recipientBookmarks = sourceBookmarks.map((b) => ({
            url: b.url,
            title: b.title,
            description: b.description || "",
            category: b.category || "",
            favicon_url: b.favicon_url || "",
            og_image_url: b.og_image_url || "",
            user_id: user.id,
            shared_by: sourceCol.user_id === user.id ? null : "Imported", // If importing own share, keep null
            is_favorite: false,
        }));

        const { data: insertedBookmarks, error: insertError } = await supabase
            .from("bookmarks")
            .insert(recipientBookmarks)
            .select("id");

        if (insertError) {
            return { error: `Failed to import bookmarks: ${insertError.message}` };
        }

        // 6. Link new bookmarks to the new collection
        if (insertedBookmarks && insertedBookmarks.length > 0) {
            const collectionBookmarks = insertedBookmarks.map((b, index) => ({
                collection_id: newCol.id,
                bookmark_id: b.id,
                order_index: index,
            }));

            await supabase.from("collection_bookmarks").insert(collectionBookmarks);

            // 7. Copy tags
            for (let i = 0; i < sourceBookmarks.length; i++) {
                const sourceId = sourceBookmarks[i].id;
                const newId = insertedBookmarks[i]?.id;
                if (!newId) continue;

                const { data: sourceTags } = await supabase
                    .from("bookmark_tags")
                    .select("tag")
                    .eq("bookmark_id", sourceId);

                if (sourceTags && sourceTags.length > 0) {
                    const tagInserts = sourceTags.map((t: any) => ({
                        bookmark_id: newId,
                        tag: t.tag,
                    }));
                    await supabase.from("bookmark_tags").insert(tagInserts);
                }
            }
        }
    }

    revalidatePath("/dashboard");
    return { success: true, collectionId: newCol.id };
}
