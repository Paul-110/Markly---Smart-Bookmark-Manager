"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Collection } from "@/types/bookmark";
import {
    getCollections,
    createCollection as createCollectionApi,
    deleteCollection as deleteCollectionApi,
    toggleCollectionVisibility as toggleVisibilityApi,
    addBookmarkToCollection as addBookmarkApi,
    removeBookmarkFromCollection as removeBookmarkApi,
    setCollectionBookmarks as setBookmarksApi,
    reorderCollectionBookmarks as reorderApi,
} from "@/lib/data/collections";
import { toast } from "sonner";

export function useCollections(userId: string | undefined, refreshTrigger?: number) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCollections = useCallback(async () => {
        if (!userId) return;
        try {
            setIsLoading(true);
            const data = await getCollections(userId);
            setCollections(data);
        } catch (error: any) {
            const message = error?.message || (typeof error === 'string' ? error : "Unknown error");
            console.error("Error fetching collections:", message, error);
            toast.error("Failed to load collections: " + message);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections, refreshTrigger]);

    const createCollection = useCallback(async (name: string, description: string) => {
        if (!userId) return;
        try {
            const newCollection = await createCollectionApi(userId, name, description);
            setCollections((prev) => [newCollection, ...prev]);
            toast.success("Collection created!");
        } catch (error) {
            console.error("Error creating collection:", error);
            toast.error("Failed to create collection");
        }
    }, [userId]);

    const removeCollection = useCallback(async (id: string) => {
        const collection = collections.find((c) => c.id === id);
        if (!collection) return;

        // Optimistic update: remove immediately
        setCollections((prev) => prev.filter((c) => c.id !== id));

        // Delay actual deletion to allow undo
        const timeoutId = setTimeout(async () => {
            try {
                await deleteCollectionApi(id);
            } catch (error) {
                toast.error("Failed to delete collection");
                // Restore if API fails
                setCollections((prev) => [...prev, collection].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            }
        }, 4000);

        toast.success("Collection deleted", {
            action: {
                label: "Undo",
                onClick: () => {
                    clearTimeout(timeoutId);
                    setCollections((prev) => [...prev, collection].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
                },
            },
            duration: 4000,
        });
    }, [collections]);

    const toggleVisibility = useCallback(async (id: string) => {
        const collection = collections.find((c) => c.id === id);
        if (!collection) return;
        try {
            await toggleVisibilityApi(id, collection.is_public);
            setCollections((prev) =>
                prev.map((c) => (c.id === id ? { ...c, is_public: !c.is_public } : c))
            );
        } catch (error) {
            toast.error("Failed to toggle visibility");
        }
    }, [collections]);

    const addBookmarkToCollection = useCallback(
        async (collectionId: string, bookmarkId: string) => {
            try {
                await addBookmarkApi(collectionId, bookmarkId);
                setCollections((prev) =>
                    prev.map((c) =>
                        c.id === collectionId && !c.bookmark_ids.includes(bookmarkId)
                            ? { ...c, bookmark_ids: [...c.bookmark_ids, bookmarkId] }
                            : c
                    )
                );
            } catch (error) {
                toast.error("Failed to add bookmark to collection");
            }
        },
        []
    );

    const removeBookmarkFromCollection = useCallback(
        async (collectionId: string, bookmarkId: string) => {
            try {
                await removeBookmarkApi(collectionId, bookmarkId);
                setCollections((prev) =>
                    prev.map((c) =>
                        c.id === collectionId
                            ? { ...c, bookmark_ids: c.bookmark_ids.filter((id) => id !== bookmarkId) }
                            : c
                    )
                );
            } catch (error) {
                toast.error("Failed to remove bookmark from collection");
            }
        },
        []
    );

    const setCollectionBookmarks = useCallback(
        async (collectionId: string, bookmarkIds: string[]) => {
            try {
                await setBookmarksApi(collectionId, bookmarkIds);
                setCollections((prev) =>
                    prev.map((c) =>
                        c.id === collectionId ? { ...c, bookmark_ids: bookmarkIds } : c
                    )
                );
            } catch (error) {
                toast.error("Failed to update collection bookmarks");
            }
        },
        []
    );

    const reorderCollectionBookmarks = useCallback(
        async (collectionId: string, activeId: string, overId: string) => {
            const collection = collections.find((c) => c.id === collectionId);
            if (!collection) return;

            const oldIds = [...collection.bookmark_ids];
            const newIds = [...oldIds];
            const oldIndex = newIds.indexOf(activeId);
            const newIndex = newIds.indexOf(overId);

            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

            newIds.splice(oldIndex, 1);
            newIds.splice(newIndex, 0, activeId);

            // Optimistic update
            setCollections((prev) => prev.map((c) => (c.id === collectionId ? { ...c, bookmark_ids: newIds } : c)));

            try {
                await reorderApi(collectionId, newIds);
            } catch (error) {
                toast.error("Failed to reorder bookmarks");
                // Revert
                setCollections((prev) => prev.map((c) => (c.id === collectionId ? { ...c, bookmark_ids: oldIds } : c)));
            }
        },
        [collections]
    );

    return {
        collections,
        isLoading,
        createCollection,
        removeCollection,
        toggleVisibility,
        addBookmarkToCollection,
        removeBookmarkFromCollection,
        setCollectionBookmarks,
        reorderCollectionBookmarks,
    };
}
