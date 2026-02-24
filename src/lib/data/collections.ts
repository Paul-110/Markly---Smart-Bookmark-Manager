import { createClient } from "@/lib/supabase/client";
import type { Collection, CollectionMember } from "@/types/bookmark";

const supabase = createClient();

export async function getCollections(userId: string): Promise<Collection[]> {
    if (!userId) return [];

    // Fetch collections owned by the user
    const { data: ownedCollections, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch collections shared with the user (where user is a member but not the owner)
    const { data: membershipRows } = await supabase
        .from("collection_members")
        .select("collection_id")
        .eq("user_id", userId);

    const memberCollectionIds = (membershipRows || []).map((m) => m.collection_id);

    // Filter out collections the user already owns
    const ownedIds = new Set((ownedCollections || []).map(c => c.id));
    const sharedCollectionIds = memberCollectionIds.filter(id => !ownedIds.has(id));

    let sharedCollections: any[] = [];
    if (sharedCollectionIds.length > 0) {
        const { data: shared } = await supabase
            .from("collections")
            .select("*")
            .in("id", sharedCollectionIds)
            .order("created_at", { ascending: false });
        sharedCollections = shared || [];
    }

    const allCollections = [...(ownedCollections || []), ...sharedCollections];
    const collectionIds = allCollections.map((c) => c.id);

    if (collectionIds.length === 0) return [];

    // Fetch bookmark IDs for each collection
    const { data: collectionBookmarks } = await supabase
        .from("collection_bookmarks")
        .select("collection_id, bookmark_id, order_index")
        .in("collection_id", collectionIds)
        .order("order_index", { ascending: true });

    // Fetch members for each collection
    const { data: members } = await supabase
        .from("collection_members")
        .select(`
      id,
      collection_id,
      user_id,
      role,
      joined_at,
      profiles:user_id (full_name, email, avatar_url)
    `)
        .in("collection_id", collectionIds);

    const bookmarkMap = new Map<string, string[]>();
    (collectionBookmarks || []).forEach((cb) => {
        if (!bookmarkMap.has(cb.collection_id)) bookmarkMap.set(cb.collection_id, []);
        bookmarkMap.get(cb.collection_id)!.push(cb.bookmark_id);
    });

    const memberMap = new Map<string, CollectionMember[]>();
    (members || []).forEach((m: any) => {
        if (!memberMap.has(m.collection_id)) memberMap.set(m.collection_id, []);
        memberMap.get(m.collection_id)!.push({
            id: m.user_id,
            name: m.profiles?.full_name || "Unknown",
            email: m.profiles?.email || "",
            avatar_url: m.profiles?.avatar_url,
            role: m.role,
            joined_at: m.joined_at,
        });
    });

    return allCollections.map((c) => ({
        ...c,
        bookmark_ids: bookmarkMap.get(c.id) || [],
        members: memberMap.get(c.id) || [],
    }));
}

export async function createCollection(
    userId: string,
    name: string,
    description: string
): Promise<Collection> {
    if (!userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("collections")
        .insert({
            user_id: userId,
            name,
            description,
        })
        .select()
        .single();

    if (error) throw error;

    // Add owner as a member
    await supabase.from("collection_members").insert({
        collection_id: data.id,
        user_id: userId,
        role: "owner",
    });

    return {
        ...data,
        bookmark_ids: [],
        members: [{
            id: userId,
            name: "You",
            role: "owner",
            joined_at: new Date().toISOString(),
        }],
    };
}

export async function deleteCollection(id: string): Promise<void> {
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) throw error;
}

export async function toggleCollectionVisibility(id: string, isPublic: boolean): Promise<void> {
    const { error } = await supabase
        .from("collections")
        .update({ is_public: !isPublic })
        .eq("id", id);
    if (error) throw error;
}

export async function addBookmarkToCollection(
    collectionId: string,
    bookmarkId: string
): Promise<void> {
    const { data: maxOrder } = await supabase
        .from("collection_bookmarks")
        .select("order_index")
        .eq("collection_id", collectionId)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

    const nextOrder = (maxOrder?.order_index ?? -1) + 1;

    const { error } = await supabase.from("collection_bookmarks").insert({
        collection_id: collectionId,
        bookmark_id: bookmarkId,
        order_index: nextOrder,
    });
    if (error && error.code !== "23505") throw error; // Ignore duplicates
}

export async function removeBookmarkFromCollection(
    collectionId: string,
    bookmarkId: string
): Promise<void> {
    const { error } = await supabase
        .from("collection_bookmarks")
        .delete()
        .eq("collection_id", collectionId)
        .eq("bookmark_id", bookmarkId);
    if (error) throw error;
}

export async function setCollectionBookmarks(
    collectionId: string,
    bookmarkIds: string[]
): Promise<void> {
    // Remove all existing bookmarks
    await supabase
        .from("collection_bookmarks")
        .delete()
        .eq("collection_id", collectionId);

    // Insert new bookmarks with order
    if (bookmarkIds.length > 0) {
        const inserts = bookmarkIds.map((bookmarkId, index) => ({
            collection_id: collectionId,
            bookmark_id: bookmarkId,
            order_index: index,
        }));
        const { error } = await supabase.from("collection_bookmarks").insert(inserts);
        if (error) throw error;
    }
}

export async function reorderCollectionBookmarks(
    collectionId: string,
    bookmarkIds: string[]
): Promise<void> {
    const updates = bookmarkIds.map((bookmarkId, index) =>
        supabase
            .from("collection_bookmarks")
            .update({ order_index: index })
            .eq("collection_id", collectionId)
            .eq("bookmark_id", bookmarkId)
    );
    await Promise.all(updates);
}
