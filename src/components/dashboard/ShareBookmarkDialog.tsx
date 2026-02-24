"use client";

import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { shareBookmark } from "@/app/actions/share-actions";
import type { Bookmark } from "@/types/bookmark";

export function ShareBookmarkDialog({
    bookmark, open, onOpenChange, onSuccess,
}: {
    bookmark: Bookmark | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess?: () => void;
}) {
    const [email, setEmail] = useState("");
    const [isSharing, setIsSharing] = useState(false);

    if (!bookmark) return null;

    const handleShare = async () => {
        if (!email.trim()) return;
        setIsSharing(true);
        try {
            await shareBookmark(bookmark.id, email);
            toast.success(`Bookmark shared with ${email}`);
            setEmail("");
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to share bookmark");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-accent" />
                        Share Bookmark
                    </DialogTitle>
                    <DialogDescription>
                        Send &ldquo;{bookmark.title}&rdquo; to another user by their email address.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Recipient Email</Label>
                        <Input
                            id="email"
                            placeholder="user@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleShare()}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            The recipient must have a Markly account to see the shared bookmark.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleShare} disabled={isSharing || !email} className="gap-2">
                        {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Share
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
