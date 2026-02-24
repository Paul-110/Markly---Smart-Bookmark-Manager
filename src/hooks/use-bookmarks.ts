import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Bookmark, SortOption } from "@/types/bookmark";

const SYNC_CHANNEL_NAME = "markly-sync";

/**
 * Broadcast a sync message to other tabs so they re-fetch data.
 */
export function notifyOtherTabs(userId: string, tabId?: string) {
    try {
        const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
        bc.postMessage({ type: "sync", userId, tabId });
        bc.close();
    } catch (e) {
        // BroadcastChannel not supported — degrade gracefully
    }
}

export function useBookmarks(userId: string | undefined, refreshTrigger: number = 0, tabId?: string) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const supabase = createClient();

    const fetchBookmarks = useCallback(async () => {
        if (!userId) return;

        try {
            setIsLoading(true);

            const { data, error } = await supabase
                .from("bookmarks")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Sanitize data to ensure arrays are defined (prevents "undefined.length" errors in UI)
            const sanitizedData = (data || []).map((b: any) => ({
                ...b,
                tags: b.tags || [],
                position: typeof b.position === 'number' ? b.position : 0,
            }));
            setBookmarks(sanitizedData as Bookmark[]);
        } catch (error: any) {
            const message = error?.message || (typeof error === 'string' ? error : "Unknown error");
            console.error("Error fetching bookmarks:", message, error);
            toast.error("Failed to load bookmarks: " + message);
        } finally {
            setIsLoading(false);
        }
    }, [supabase, userId]);

    // Re-fetch when refreshTrigger changes
    useEffect(() => {
        fetchBookmarks();
    }, [fetchBookmarks, refreshTrigger]);

    // Derived State: Categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        bookmarks.forEach((b) => {
            if (b.category) cats.add(b.category);
        });
        return Array.from(cats).sort();
    }, [bookmarks]);

    // Derived State: Filtered & Sorted Bookmarks
    const filtered = useMemo(() => {
        let result = [...bookmarks];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (b) =>
                    b.title.toLowerCase().includes(q) ||
                    b.url.toLowerCase().includes(q) ||
                    (b.description && b.description.toLowerCase().includes(q))
            );
        }

        if (selectedCategory) {
            result = result.filter((b) => b.category === selectedCategory);
        }

        switch (sortBy) {
            case "oldest":
                result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case "alphabetical":
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "most-visited":
                result.sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0));
                break;
            case "custom":
                result.sort((a, b) => ((a as any).position || 0) - ((b as any).position || 0));
                break;
            case "newest":
            default:
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
        }

        return result;
    }, [bookmarks, searchQuery, selectedCategory, sortBy]);

    // Actions
    const addBookmark = useCallback(async (data: any) => {
        if (!userId) {
            toast.error("You must be logged in to add bookmarks");
            return null;
        }

        const { url, title, description, category, tags = [], favicon_url, og_image_url } = data;

        try {
            const { data: bookmark, error } = await supabase
                .from("bookmarks")
                .insert({
                    url,
                    title: title || url,
                    description,
                    category,
                    favicon_url: favicon_url || "",
                    og_image_url: og_image_url || "",
                    user_id: userId,
                })
                .select()
                .single();

            if (error) throw error;

            // Insert tags
            if (tags && tags.length > 0) {
                const tagInserts = tags.map((tag: string) => ({
                    bookmark_id: bookmark.id,
                    tag,
                }));
                const { error: tagError } = await supabase.from("bookmark_tags").insert(tagInserts);
                if (tagError) throw tagError;
            }

            const sanitizedNewBookmark = {
                ...bookmark,
                tags: tags || [],
            };
            setBookmarks((prev) => [sanitizedNewBookmark, ...prev]);
            toast.success("Bookmark added");
            if (userId) notifyOtherTabs(userId, tabId);
            return bookmark;
        } catch (error: any) {
            console.error("Add bookmark failed:", error);
            toast.error(error.message || "Failed to add bookmark");
            return null;
        }
    }, [supabase, userId, tabId]);

    const editBookmark = useCallback(async (id: string, updates: Partial<Bookmark>) => {
        try {
            // Separate tags from other fields since they live in a different table
            const { tags, ...fields } = updates;

            // 1. Update main bookmark fields
            if (Object.keys(fields).length > 0) {
                const { error } = await supabase.from("bookmarks").update(fields).eq("id", id);
                if (error) throw error;
            }

            // 2. Update tags if they are included in the update
            if (tags !== undefined) {
                // Replace all tags: Delete old ones, insert new ones
                await supabase.from("bookmark_tags").delete().eq("bookmark_id", id);

                if (tags.length > 0) {
                    const tagInserts = tags.map(tag => ({ bookmark_id: id, tag }));
                    await supabase.from("bookmark_tags").insert(tagInserts);
                }
            }

            setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
            toast.success("Bookmark updated");
            if (userId) notifyOtherTabs(userId, tabId);
        } catch (error: any) {
            console.error("Update failed:", error);
            toast.error("Failed to update bookmark: " + (error.message || "Unknown error"));
        }
    }, [supabase, userId, tabId]);

    const removeBookmark = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from("bookmarks").delete().eq("id", id);
            if (error) throw error;

            setBookmarks((prev) => prev.filter((b) => b.id !== id));
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            toast.success("Bookmark deleted");
            if (userId) notifyOtherTabs(userId, tabId);
        } catch (error) {
            toast.error("Failed to delete bookmark");
        }
    }, [supabase, userId, tabId]);

    const toggleFavorite = useCallback(async (id: string) => {
        const bookmark = bookmarks.find((b) => b.id === id);
        if (!bookmark) return;

        try {
            const newVal = !bookmark.is_favorite;
            // Optimistic update
            setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, is_favorite: newVal } : b)));

            const { error } = await supabase.from("bookmarks").update({ is_favorite: newVal }).eq("id", id);
            if (error) throw error;
            if (userId) notifyOtherTabs(userId, tabId);
        } catch (error) {
            // Revert
            setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, is_favorite: !bookmark.is_favorite } : b)));
            toast.error("Failed to update favorite status");
        }
    }, [bookmarks, supabase, userId, tabId]);

    // Selection Logic
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(filtered.map((b) => b.id)));
    }, [filtered]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const deleteSelected = useCallback(async () => {
        if (selectedIds.size === 0) return;
        try {
            const ids = Array.from(selectedIds);
            const { error } = await supabase.from("bookmarks").delete().in("id", ids);
            if (error) throw error;

            setBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
            clearSelection();
            toast.success(`${ids.length} bookmarks deleted`);
            if (userId) notifyOtherTabs(userId, tabId);
        } catch (error) {
            toast.error("Failed to delete selected bookmarks");
        }
    }, [selectedIds, supabase, clearSelection, userId, tabId]);

    const bulkEdit = useCallback(async (updates: Partial<Bookmark>) => {
        if (selectedIds.size === 0) return;
        try {
            const ids = Array.from(selectedIds);
            const { error } = await supabase.from("bookmarks").update(updates).in("id", ids);
            if (error) throw error;

            setBookmarks((prev) => prev.map((b) => (selectedIds.has(b.id) ? { ...b, ...updates } : b)));
            clearSelection();
            toast.success(`${ids.length} bookmarks updated`);
            if (userId) notifyOtherTabs(userId, tabId);
        } catch (error) {
            toast.error("Failed to update selected bookmarks");
        }
    }, [selectedIds, supabase, clearSelection, userId, tabId]);

    const reorder = useCallback(async (activeId: string, overId: string) => {
        const oldIndex = filtered.findIndex((b) => b.id === activeId);
        const newIndex = filtered.findIndex((b) => b.id === overId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        // Simulate the move to find neighbors
        const newOrder = [...filtered];
        const [movedItem] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, movedItem);

        const prevItem = newOrder[newIndex - 1];
        const nextItem = newOrder[newIndex + 1];

        const prevPos = typeof (prevItem as any)?.position === 'number' ? (prevItem as any).position : 0;
        const nextPos = typeof (nextItem as any)?.position === 'number' ? (nextItem as any).position : 0;
        let newPos;

        if (!prevItem) {
            // Moved to start - must be smaller than next
            newPos = nextPos - 1024;
        } else if (!nextItem) {
            // Moved to end - must be larger than prev
            newPos = prevPos + 1024;
        } else {
            // Moved between
            newPos = (prevPos + nextPos) / 2;
        }

        if (typeof newPos !== 'number' || isNaN(newPos)) newPos = 0;

        // Optimistic update
        setBookmarks((prev) => prev.map((b) => (b.id === activeId ? { ...b, position: newPos } : b)) as Bookmark[]);

        try {
            if (!userId) throw new Error("User not authenticated");

            const { error } = await supabase.from("bookmarks").update({ position: newPos }).eq("id", activeId);
            if (error) throw error;
        } catch (error: any) {
            const errorMessage = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
            console.error("Reorder failed:", errorMessage);

            if (errorMessage.includes("Could not find the 'position' column")) {
                toast.error("Database update required: Missing 'position' column.");
            } else {
                toast.error("Failed to save order: " + errorMessage);
            }
            fetchBookmarks(); // Revert
        }
    }, [filtered, supabase, fetchBookmarks, userId]);

    return {
        bookmarks,
        filtered,
        isLoading,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        categories,
        selectedCategory,
        setSelectedCategory,
        addBookmark,
        editBookmark,
        removeBookmark,
        toggleFavorite,
        selectedIds,
        toggleSelect,
        selectAll,
        clearSelection,
        deleteSelected,
        bulkEdit,
        reorder,
    };
}