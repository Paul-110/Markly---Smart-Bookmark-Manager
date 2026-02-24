"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Bookmark as BookmarkType } from "@/types/bookmark";

interface AddBookmarkDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onAdd: (b: any) => void;
    existingBookmarks: BookmarkType[];
}

export const AddBookmarkDialog = React.memo(function AddBookmarkDialog({
    open, onOpenChange, onAdd, existingBookmarks,
}: AddBookmarkDialogProps) {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [faviconUrl, setFaviconUrl] = useState("");
    const [ogImageUrl, setOgImageUrl] = useState("");
    const [isFetching, setIsFetching] = useState(false);
    const [fetched, setFetched] = useState(false);

    // AI suggestion state
    const [aiCategory, setAiCategory] = useState("");
    const [aiTags, setAiTags] = useState<string[]>([]);
    const [aiConfidence, setAiConfidence] = useState<"high" | "medium" | "low">("low");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiDismissed, setAiDismissed] = useState(false);
    const [aiReady, setAiReady] = useState(false);

    // Duplicate detection
    const normalizeUrl = (u: string) => {
        try {
            const parsed = new URL(u.includes("://") ? u : `https://${u}`);
            return parsed.hostname.replace(/^www\./, "") + parsed.pathname.replace(/\/$/, "") + parsed.search;
        } catch { return u.toLowerCase().trim(); }
    };

    const duplicateBookmark = useMemo(() => {
        const trimmed = url.trim();
        if (!trimmed) return null;
        const normalized = normalizeUrl(trimmed);
        return existingBookmarks.find((b) => normalizeUrl(b.url) === normalized) || null;
    }, [url, existingBookmarks]);

    // Debounced auto-fetch
    useEffect(() => {
        let trimmed = url.trim();
        if (!trimmed) { setFetched(false); setAiReady(false); return; }
        if (!/^https?:\/\/.+\..+/.test(trimmed)) {
            if (/^[a-zA-Z0-9].*\..+/.test(trimmed)) {
                trimmed = `https://${trimmed}`;
            } else {
                return;
            }
        }

        const timer = setTimeout(async () => {
            setIsFetching(true);
            try {
                const { fetchUrlMetadata } = await import("@/app/actions/fetch-metadata");
                const meta = await fetchUrlMetadata(trimmed);
                if (meta.title && !title) setTitle(meta.title);
                if (meta.description && !description) setDescription(meta.description);
                if (meta.favicon_url) setFaviconUrl(meta.favicon_url);
                if (meta.og_image_url) setOgImageUrl(meta.og_image_url);
                setFetched(true);

                setAiLoading(true);
                setAiDismissed(false);
                try {
                    const { suggestCategoryAndTags } = await import("@/app/actions/suggest-tags");
                    const suggestions = await suggestCategoryAndTags({
                        url: trimmed,
                        title: meta.title || title,
                        description: meta.description || description,
                    });
                    setAiCategory(suggestions.category);
                    setAiTags(suggestions.tags);
                    setAiConfidence(suggestions.confidence);
                    setAiReady(true);
                } catch {
                } finally {
                    setAiLoading(false);
                }
            } catch {
            } finally {
                setIsFetching(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [url]);

    const acceptAllSuggestions = () => {
        if (aiCategory && !category) setCategory(aiCategory);
        if (aiTags.length > 0) {
            const existing = tags.split(",").map((t) => t.trim()).filter(Boolean);
            const merged = [...new Set([...existing, ...aiTags])];
            setTags(merged.join(", "));
        }
        setAiDismissed(true);
        toast.success("AI suggestions applied!");
    };

    const resetForm = () => {
        setUrl(""); setTitle(""); setDescription(""); setCategory("");
        setTags(""); setFaviconUrl(""); setOgImageUrl("");
        setFetched(false); setIsFetching(false);
        setAiCategory(""); setAiTags([]); setAiLoading(false);
        setAiDismissed(false); setAiReady(false);
    };

    const handleSubmit = () => {
        if (!url.trim()) {
            toast.error("Please enter a URL");
            return;
        }
        let finalUrl = url.trim();
        if (!/^https?:\/\//.test(finalUrl)) finalUrl = `https://${finalUrl}`;
        onAdd({
            url: finalUrl,
            title: title.trim() || finalUrl,
            description: description.trim(),
            category: category.trim(),
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            favicon_url: faviconUrl,
            og_image_url: ogImageUrl,
            is_favorite: false,
        });
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-serif">Add Bookmark</DialogTitle>
                    <DialogDescription>Paste a URL and we&apos;ll auto-fill the details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2 flex-1 overflow-y-auto px-1">
                    <div className="space-y-2">
                        <Label htmlFor="url">URL *</Label>
                        <div className="relative">
                            <Input
                                id="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => { setUrl(e.target.value); setFetched(false); setAiReady(false); setAiDismissed(false); }}
                                className="pr-10"
                                aria-required="true"
                            />
                            {isFetching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="Fetching metadata">
                                    <div className="h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {!isFetching && fetched && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" aria-label="Metadata fetched">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {duplicateBookmark && (
                        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 flex items-start gap-2" role="alert">
                            <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">This bookmark already exists</p>
                        </div>
                    )}

                    {aiLoading && (
                        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 flex items-center gap-2" role="status">
                            <div className="h-3.5 w-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-muted-foreground">AI is analyzing this page...</span>
                        </div>
                    )}

                    {aiReady && !aiDismissed && !aiLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-3"
                            role="group"
                            aria-label="AI Suggestions"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">✨ AI Suggestions</span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => setAiDismissed(true)} className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2">Dismiss</Button>
                                    <Button variant="default" size="sm" onClick={acceptAllSuggestions} className="h-6 text-[10px] px-2 bg-accent hover:bg-accent/90 text-white">Accept All</Button>
                                </div>
                            </div>

                            {/* Suggested Category */}
                            {aiCategory && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Category</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCategory(aiCategory);
                                                toast.success(`Category set to "${aiCategory}"`);
                                            }}
                                            className={cn(
                                                "text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer",
                                                category === aiCategory
                                                    ? "bg-accent text-white border-accent"
                                                    : "bg-background hover:bg-accent/10 border-border hover:border-accent/40"
                                            )}
                                        >
                                            {aiCategory}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Suggested Tags */}
                            {aiTags.length > 0 && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tags</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {aiTags.map(tag => {
                                            const currentTags = tags.split(",").map(t => t.trim()).filter(Boolean);
                                            const isApplied = currentTags.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isApplied) {
                                                            const filtered = currentTags.filter(t => t !== tag);
                                                            setTags(filtered.join(", "));
                                                        } else {
                                                            const merged = [...new Set([...currentTags, tag])];
                                                            setTags(merged.join(", "));
                                                        }
                                                    }}
                                                    className={cn(
                                                        "text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer",
                                                        isApplied
                                                            ? "bg-accent text-white border-accent"
                                                            : "bg-background hover:bg-accent/10 border-border hover:border-accent/40"
                                                    )}
                                                >
                                                    #{tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {aiConfidence && (
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        aiConfidence === "high" ? "bg-green-500" : aiConfidence === "medium" ? "bg-yellow-500" : "bg-red-400"
                                    )} />
                                    <span className="text-[10px] text-muted-foreground capitalize">{aiConfidence} confidence</span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="Page title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Optional description..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" placeholder="e.g. Design" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <Input id="tags" placeholder="tag1, tag2" value={tags} onChange={(e) => setTags(e.target.value)} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isFetching}>Add Bookmark</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});
