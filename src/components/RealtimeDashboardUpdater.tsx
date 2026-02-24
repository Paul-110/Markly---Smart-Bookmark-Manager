"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const SYNC_CHANNEL_NAME = "markly-sync";

/**
 * Listens for real-time updates from Supabase AND cross-tab sync via BroadcastChannel.
 * Triggers data refresh in the dashboard when changes are detected.
 */
export function RealtimeDashboardUpdater({ userId, tabId, onNewShare, onUpdate }: { userId: string | undefined; tabId?: string; onNewShare?: () => void; onUpdate?: () => void }) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasNewInviteRef = useRef(false);

    // Store callbacks in a ref to prevent effect re-running on every render
    const callbacksRef = useRef({ onNewShare, onUpdate });
    useEffect(() => {
        callbacksRef.current = { onNewShare, onUpdate };
    }, [onNewShare, onUpdate]);

    useEffect(() => {
        if (!userId) return;

        const handleRealtimeEvent = (isInvite: boolean) => {
            if (isInvite) hasNewInviteRef.current = true;

            // Clear existing timeout to debounce
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                // Handle Invite Specifics (Sound + Toast)
                if (hasNewInviteRef.current) {
                    toast.info("A new collection has been shared with you!", {
                        description: "Your dashboard is updating automatically.",
                    });

                    if (callbacksRef.current.onNewShare) callbacksRef.current.onNewShare();
                    hasNewInviteRef.current = false;
                }

                // Trigger client-side data refresh (no router.refresh needed)
                if (callbacksRef.current.onUpdate) callbacksRef.current.onUpdate();

                timeoutRef.current = null;
            }, 500); // Increased debounce to 500ms for more stability
        };

        // --- Supabase Realtime (server → this tab) ---
        const supabase = createClient();
        const channel = supabase
            .channel('dashboard-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'collection_members',
                    filter: `user_id=eq.${userId}`
                },
                () => handleRealtimeEvent(true)
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'collections',
                    filter: `user_id=eq.${userId}`
                },
                () => handleRealtimeEvent(false)
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookmarks',
                    filter: `user_id=eq.${userId}`
                },
                () => handleRealtimeEvent(false)
            )
            .subscribe();

        // --- BroadcastChannel (cross-tab sync for same user) ---
        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
            bc.onmessage = (event) => {
                // Only process messages from the same user and NOT from the same tab
                if (
                    event.data?.userId === userId &&
                    event.data?.type === "sync" &&
                    event.data?.tabId !== tabId
                ) {
                    handleRealtimeEvent(false);
                }
            };
        } catch (e) {
            // BroadcastChannel not supported (e.g. some older browsers) — degrade gracefully
        }

        // Clean up
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            supabase.removeChannel(channel);
            if (bc) bc.close();
        };
    }, [userId]);

    return null;
}