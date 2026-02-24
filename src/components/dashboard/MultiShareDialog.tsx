"use client";

import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bookmark } from "@/types/bookmark";

import { useAuth } from "@/hooks/use-auth";
import { shareMultipleBookmarks } from "@/app/actions/share-actions";

interface MultiShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookmarks: Bookmark[];
    selectedIds: Set<string>;
    clearSelection: () => void;
    onSuccess?: () => void;
}

export function MultiShareDialog({ open, onOpenChange, bookmarks, selectedIds, clearSelection, onSuccess }: MultiShareDialogProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    const handleShare = async () => {
        if (!email) {
            toast.error("Please enter a recipient's email address.");
            return;
        }
        if (!user) {
            toast.error("You must be logged in to share bookmarks.");
            return;
        }

        setIsLoading(true);
        const collectionName = `Shared from ${user.email}`;
        const bookmarkIds = Array.from(selectedIds);

        const result = await shareMultipleBookmarks(bookmarkIds, email, collectionName);

        setIsLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`Shared ${selectedIds.size} bookmarks with ${email}`);
            clearSelection();
            onSuccess?.();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share Bookmarks</DialogTitle>
                    <DialogDescription>
                        You are about to share {selectedIds.size} bookmarks. Enter the email address of the person you want to share with.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="font-semibold">Selected bookmarks:</p>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {bookmarks
                            .filter(b => selectedIds.has(b.id))
                            .map(b => (
                                <li key={b.id} className="text-sm text-muted-foreground truncate">
                                    {b.title}
                                </li>
                            ))}
                    </ul>
                    <Input
                        id="multi-share-email"
                        name="multi-share-email"
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        autoComplete="email"
                        aria-label="Recipient email address"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleShare} disabled={isLoading}>
                        {isLoading ? "Sharing..." : "Share"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
