"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import type { Bookmark as BookmarkType } from "@/types/bookmark";

// ─── Edit Bookmark Dialog ───────────────────────────────────
interface EditBookmarkDialogProps {
    bookmark: BookmarkType | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSave: (id: string, updates: any) => void;
}

export const EditBookmarkDialog = React.memo(function EditBookmarkDialog({
    bookmark, open, onOpenChange, onSave,
}: EditBookmarkDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");

    useEffect(() => {
        if (bookmark) {
            setTitle(bookmark.title);
            setDescription(bookmark.description);
            setCategory(bookmark.category);
            setTags(bookmark.tags.join(", "));
        }
    }, [bookmark]);

    if (!bookmark) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif">Edit Bookmark</DialogTitle>
                    <DialogDescription>Update the bookmark details below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-category">Category</Label>
                            <Input id="edit-category" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-tags">Tags</Label>
                            <Input id="edit-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => {
                        onSave(bookmark.id, {
                            title, description, category,
                            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                        });
                        onOpenChange(false);
                    }}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

// ─── Bulk Edit Dialog ─────────────────────────────────────
interface BulkEditDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSave: (data: any) => void;
    count: number;
}

export const BulkEditDialog = React.memo(function BulkEditDialog({
    open, onOpenChange, onSave, count,
}: BulkEditDialogProps) {
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [tagMode, setTagMode] = useState<"add" | "replace" | "remove">("add");

    const handleSave = () => {
        const data: any = { tagMode };
        if (category) data.category = category;
        if (tags) data.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        onSave(data);
        setCategory(""); setTags(""); setTagMode("add");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {count} Bookmarks</DialogTitle>
                    <DialogDescription>Apply changes to all selected bookmarks.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="bulk-category">Category</Label>
                        <Input id="bulk-category" placeholder="Set new category..." value={category} onChange={(e) => setCategory(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bulk-tags">Tags</Label>
                        <Input id="bulk-tags" placeholder="tag1, tag2" value={tags} onChange={(e) => setTags(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bulk-tag-mode">Tag Mode</Label>
                        <Select value={tagMode} onValueChange={(v: any) => setTagMode(v)}>
                            <SelectTrigger id="bulk-tag-mode">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="add">Add tags (keep existing)</SelectItem>
                                <SelectItem value="replace">Replace tags (overwrite)</SelectItem>
                                <SelectItem value="remove">Remove tags</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Apply Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});
