"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";


/**
 * Shares a single bookmark with another user.
 *
 * This is a convenience wrapper around `shareMultipleBookmarks`.
 * @param bookmarkId - The UUID of the bookmark to share.
 * @param email - The email of the existing Markly user to share with.
 * @returns An object indicating success or an error message.
 */
export async function shareBookmark(bookmarkId: string, email: string) {
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Unauthorized" };
    }

    // To create a meaningful collection name, we first need to fetch the bookmark's title.
    const { data: bookmark, error: bookmarkError } = await supabase
        .from("bookmarks")
        .select("title")
        .eq("id", bookmarkId)
        .single();

    if (bookmarkError || !bookmark) {
        return { error: "Failed to find the bookmark to share." };
    }

    const collectionName = `Shared: ${bookmark.title.substring(0, 50)}`;

    // Now, call the existing function to handle the core sharing logic.
    return shareMultipleBookmarks([bookmarkId], email, collectionName);
}


/**
 * Shares multiple bookmarks with another existing user by creating a new dedicated collection.
 *
 * @param bookmarkIds - An array of bookmark UUIDs to share.
 * @param email - The email of the existing Markly user to share with.
 * @param collectionName - The name for the new collection that will be created (e.g., "Shared from user@example.com").
 * @returns An object indicating success or an error message.
 */
export async function shareMultipleBookmarks(
    bookmarkIds: string[],
    email: string,
    collectionName: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized: You must be logged in to share bookmarks." };
    }

    if (!bookmarkIds || bookmarkIds.length === 0) {
        return { error: "No bookmarks selected to share." };
    }

    if (!email) {
        return { error: "Recipient email is required." };
    }

    // 1. Find the user to share with by their email using the secure RPC function.
    const { data: profiles, error: recipientError } = await supabase
        .rpc("get_profile_by_email", { email_input: email });

    if (recipientError || !profiles || profiles.length === 0) {
        return { error: "Recipient not found. You can only share with existing Markly users." };
    }

    const recipientUser = profiles[0];

    // 2. Create a new collection for sharing.
    const { data: collection, error: colError } = await supabase
        .from("collections")
        .insert({
            user_id: user.id, // The sharer is the owner of the collection.
            name: collectionName,
            description: `Shared by ${user.email || 'a user'}.`,
            is_public: false,
        })
        .select('id')
        .single();

    if (colError || !collection) {
        console.error("Error creating collection:", colError);
        return { error: `Failed to create sharing collection: ${colError?.message}` };
    }

    // 3. Add all selected bookmarks to this new collection.
    const collectionBookmarks = bookmarkIds.map((bookmark_id, index) => ({
        collection_id: collection.id,
        bookmark_id,
        order_index: index,
    }));

    const { error: cbError } = await supabase.from("collection_bookmarks").insert(collectionBookmarks);

    if (cbError) {
        console.error("Error adding bookmarks to collection:", cbError);
        // Rollback: delete the collection we just created to avoid orphaned data.
        await supabase.from('collections').delete().eq('id', collection.id);
        return { error: `Failed to add bookmarks to the collection: ${cbError.message}` };
    }

    // 4. Invite the target user to the collection by adding them to `collection_members`.
    const { error: inviteError } = await supabase.from('collection_members').insert({
        collection_id: collection.id,
        user_id: recipientUser.id,
        role: 'viewer' // or 'editor', depending on desired permissions
    });

    if (inviteError) {
        console.error("Error inviting member:", inviteError);
        // Rollback if the final step fails.
        await supabase.from('collection_bookmarks').delete().eq('collection_id', collection.id);
        await supabase.from('collections').delete().eq('id', collection.id);
        return { error: `Failed to share the collection with the user: ${inviteError.message}` };
    }

    // 5. Copy bookmarks into the recipient's library with shared_by metadata.
    // This ensures shared bookmarks appear in the recipient's "All Bookmarks" section.
    try {
        // Fetch the full bookmark data for all selected bookmarks
        const { data: sourceBookmarks, error: fetchError } = await supabase
            .from('bookmarks')
            .select('*')
            .in('id', bookmarkIds);

        if (fetchError) throw fetchError;

        if (sourceBookmarks && sourceBookmarks.length > 0) {
            // Create copies for the recipient
            const recipientBookmarks = sourceBookmarks.map((b: any) => ({
                url: b.url,
                title: b.title,
                description: b.description || '',
                category: b.category || '',
                favicon_url: b.favicon_url || '',
                og_image_url: b.og_image_url || '',
                user_id: recipientUser.id,
                shared_by: user.email || 'Unknown',
                is_favorite: false,
            }));

            const { data: insertedBookmarks, error: insertError } = await supabase
                .from('bookmarks')
                .insert(recipientBookmarks)
                .select('id');

            if (insertError) {
                console.error("Error copying bookmarks to recipient:", insertError);
                // Non-fatal: the collection share still succeeded
            }

            // Copy tags for each bookmark
            if (insertedBookmarks && insertedBookmarks.length > 0) {
                for (let i = 0; i < sourceBookmarks.length; i++) {
                    const sourceId = sourceBookmarks[i].id;
                    const newId = insertedBookmarks[i]?.id;
                    if (!newId) continue;

                    const { data: sourceTags } = await supabase
                        .from('bookmark_tags')
                        .select('tag')
                        .eq('bookmark_id', sourceId);

                    if (sourceTags && sourceTags.length > 0) {
                        const tagInserts = sourceTags.map((t: any) => ({
                            bookmark_id: newId,
                            tag: t.tag,
                        }));
                        await supabase.from('bookmark_tags').insert(tagInserts);
                    }
                }
            }
        }
    } catch (copyError) {
        console.error("Error copying bookmarks to recipient's library:", copyError);
        // Non-fatal: the collection + invite succeeded, bookmark copies are a bonus
    }

    // 6. Revalidate the dashboard path for the sharer to show the new shared collection.
    revalidatePath("/dashboard");

    return { success: true, collectionId: collection.id };
}