import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/types/bookmark";

export async function getBookmarks(): Promise<Bookmark[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 1. Get collections the user is a member of
    const { data: memberships, error: membershipError } = await supabase
        .from('collection_members')
        .select('collection_id')
        .eq('user_id', user.id);

    if (membershipError) throw membershipError;

    const collectionIds = memberships.map(m => m.collection_id);

    // 2. Get all bookmark IDs from those collections
    const { data: collectionBookmarks, error: cbError } = await supabase
        .from('collection_bookmarks')
        .select('bookmark_id, collection_id')
        .in('collection_id', collectionIds);

    if (cbError) throw cbError;

    const sharedBookmarkIds = collectionBookmarks.map(cb => cb.bookmark_id);
    const bookmarkToCollectionMap = new Map(collectionBookmarks.map(cb => [cb.bookmark_id, cb.collection_id]));

    // 3. Fetch all bookmarks owned by the user OR in shared collections
    const { data: bookmarks, error } = await supabase
        .from("bookmarks")
        .select("*")
        .or(`user_id.eq.${user.id},id.in.(${sharedBookmarkIds.join(',')})`)
        .order("created_at", { ascending: false });

    if (error) throw error;

    const bookmarkIds = (bookmarks || []).map((b) => b.id);

    // 4. Fetch tags and member details in parallel
    const [tagsResponse, memberDetailsResponse] = await Promise.all([
        supabase.from("bookmark_tags").select("bookmark_id, tag").in("bookmark_id", bookmarkIds),
        supabase.from('collection_members').select('collection_id, role, profiles (id, full_name, email, avatar_url)').in('collection_id', collectionIds)
    ]);

    const { data: tags, error: tagsError } = tagsResponse;
    if (tagsError) throw tagsError;

    const { data: memberDetails, error: memberError } = memberDetailsResponse;
    if(memberError) throw memberError;

    const tagMap = new Map<string, string[]>();
    (tags || []).forEach((t) => {
        if (!tagMap.has(t.bookmark_id)) tagMap.set(t.bookmark_id, []);
        tagMap.get(t.bookmark_id)!.push(t.tag);
    });
    
    const collectionToMembersMap = new Map<string, any[]>();
        memberDetails.forEach(m => {
        if (!collectionToMembersMap.has(m.collection_id)) {
            collectionToMembersMap.set(m.collection_id, []);
        }
        collectionToMembersMap.get(m.collection_id)!.push({
            id: m.profiles.id,
            name: m.profiles.full_name,
            email: m.profiles.email,
            avatar_url: m.profiles.avatar_url,
            role: m.role
        });
    });


    // 5. Combine data
    return (bookmarks || []).map((b) => {
        const collection_id = bookmarkToCollectionMap.get(b.id);
        const shared_with = collection_id ? collectionToMembersMap.get(collection_id) : undefined;
        return {
        ...b,
        tags: tagMap.get(b.id) || [],
        collection_id: collection_id,
        shared_with: shared_with,
    }});
}

export async function createBookmark(
    bookmark: Omit<Bookmark, "id" | "order_index" | "visit_count" | "last_visited_at" | "created_at" | "user_id">
): Promise<Bookmark> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get the next order index
    const { data: maxOrder } = await supabase
        .from("bookmarks")
        .select("order_index")
        .eq("user_id", user.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

    const nextOrder = (maxOrder?.order_index ?? -1) + 1;

    const { data, error } = await supabase
        .from("bookmarks")
        .insert({
            user_id: user.id,
            url: bookmark.url,
            title: bookmark.title,
            description: bookmark.description || "",
            favicon_url: bookmark.favicon_url || "",
            og_image_url: bookmark.og_image_url || "",
            category: bookmark.category || "",
            order_index: nextOrder,
            is_favorite: bookmark.is_favorite || false,
            reminder_at: bookmark.reminder_at || null,
        })
        .select()
        .single();

    if (error) throw error;

    // Insert tags
    if (bookmark.tags && bookmark.tags.length > 0) {
        const tagInserts = bookmark.tags.map((tag) => ({
            bookmark_id: data.id,
            tag,
        }));
        await supabase.from("bookmark_tags").insert(tagInserts);
    }

    return { ...data, tags: bookmark.tags || [] };
}

export async function updateBookmark(
    id: string,
    updates: Partial<Omit<Bookmark, "id" | "user_id" | "created_at">>
): Promise<void> {
    const supabase = createClient();
    const { tags, ...dbUpdates } = updates;

    const { error } = await supabase
        .from("bookmarks")
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw error;

    // Update tags if provided
    if (tags !== undefined) {
        // Delete existing tags
        await supabase.from("bookmark_tags").delete().eq("bookmark_id", id);
        // Insert new tags
        if (tags.length > 0) {
            const tagInserts = tags.map((tag) => ({ bookmark_id: id, tag }));
            await supabase.from("bookmark_tags").insert(tagInserts);
        }
    }
}

export async function deleteBookmark(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) throw error;
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from("bookmarks")
        .update({ is_favorite: !isFavorite })
        .eq("id", id);
    if (error) throw error;
}

export async function reorderBookmarks(
    bookmarkIds: string[]
): Promise<void> {
    const supabase = createClient();
    // Update order_index for each bookmark in the new order
    const updates = bookmarkIds.map((id, index) =>
        supabase
            .from("bookmarks")
            .update({ order_index: index })
            .eq("id", id)
    );
    await Promise.all(updates);
}
