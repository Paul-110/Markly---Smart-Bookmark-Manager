"use client";

import React from "react";
import {
    ArrowLeft, Bookmark, Grid, List as ListIcon,
    Share2, Trash2, Download, MoreVertical, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import type { Collection, Bookmark as BookmarkType } from "@/types/bookmark";
import { BookmarkCard, SortableBookmarkCard, SortableBookmarkListRow } from "./BookmarkCard";

interface CollectionDetailViewProps {
    collection: Collection;
    bookmarks: BookmarkType[];
    onBack: () => void;
    onAddBookmark: () => void;
    onImport: (collection: Collection) => void;
    isOwner: boolean;
    userId: string;
    onDeleteCollection: (id: string) => void;
    // Props passed through to cards
    layout: "grid" | "list";
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (bookmark: BookmarkType) => void;
    onShare: (bookmark: BookmarkType) => void;
    onSummarize: (id: string) => void;
    onScheduleReminder: (id: string, type: any) => void;
    onCopyShortUrl: (id: string) => void;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<BookmarkType>) => void;
}

export function CollectionDetailView({
    collection,
    bookmarks,
    onBack,
    onAddBookmark,
    onImport,
    isOwner,
    userId,
    layout,
    onToggleFavorite,
    onDelete,
    onEdit,
    onShare,
    onSummarize,
    onScheduleReminder,
    onCopyShortUrl,
    selectedIds,
    onToggleSelect,
    onUpdate,
    onDeleteCollection,
}: CollectionDetailViewProps) {
    const isSharedWithMe = !isOwner && collection.user_id !== userId;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="rounded-full hover:bg-accent/10 hover:text-accent"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-serif font-bold tracking-tight truncate">{collection.name}</h1>
                            {isSharedWithMe && (
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 whitespace-nowrap">
                                    Shared with you
                                </Badge>
                            )}
                            {!isSharedWithMe && collection.members && collection.members.length > 1 && (
                                <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 whitespace-nowrap">
                                    Shared
                                </Badge>
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {isSharedWithMe && (
                                <p className="text-[10px] text-muted-foreground">
                                    Shared by {collection.members?.find(m => m.role === 'owner')?.name} ({collection.members?.find(m => m.role === 'owner')?.email})
                                </p>
                            )}
                            {!isSharedWithMe && collection.members && collection.members.length > 1 && (
                                <p className="text-[10px] text-muted-foreground">
                                    Shared to: {collection.members.filter(m => m.id !== userId).map(m => `${m.name} (${m.email})`).join(", ")}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground truncate">{collection.description || "No description provided."}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isSharedWithMe && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full gap-2 border-accent/20 hover:bg-accent/5"
                            onClick={() => onImport(collection)}
                        >
                            <Download className="h-4 w-4" /> Import to My Collections
                        </Button>
                    )}
                    {isOwner && (
                        <>
                            <Button
                                onClick={onAddBookmark}
                                className="rounded-full bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 gap-2"
                            >
                                <Plus className="h-4 w-4" /> Add to Collection
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDeleteCollection(collection.id)}
                                className="rounded-full h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/40"
                                title="Delete Collection"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </header>

            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>{bookmarks.length} bookmarks</span>
                </div>
                {/* Could add sorting/layout options here if specific to this view */}
            </div>

            {bookmarks.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                    <p className="text-muted-foreground">This collection is empty.</p>
                    {isOwner && (
                        <Button variant="link" className="text-accent mt-2" onClick={onAddBookmark}>
                            Add your first bookmark
                        </Button>
                    )}
                </div>
            ) : (
                <div
                    className={layout === "grid" ? "grid gap-4 pb-10" : "flex flex-col gap-1 pb-10"}
                    style={layout === "grid" ? { gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" } : undefined}
                >
                    <AnimatePresence>
                        {bookmarks.map((bookmark) => (
                            <motion.div
                                key={bookmark.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                {layout === "grid" ? (
                                    <BookmarkCard
                                        bookmark={bookmark}
                                        onToggleFavorite={onToggleFavorite}
                                        onDelete={onDelete}
                                        onEdit={onEdit}
                                        onShare={onShare}
                                        onSummarize={onSummarize}
                                        onScheduleReminder={onScheduleReminder}
                                        onCopyShortUrl={onCopyShortUrl}
                                        isSelected={selectedIds.has(bookmark.id)}
                                        onToggleSelect={onToggleSelect}
                                        selectionMode={selectedIds.size > 0}
                                        onUpdate={onUpdate}
                                    />
                                ) : (
                                    <div className="p-2 border rounded-xl hover:bg-accent/5 transition-colors flex items-center gap-4">
                                        {/* Fallback for list row if needed, but for now using BookmarkCard in both or custom list logic */}
                                        <BookmarkCard
                                            bookmark={bookmark}
                                            onToggleFavorite={onToggleFavorite}
                                            onDelete={onDelete}
                                            onEdit={onEdit}
                                            onShare={onShare}
                                            onSummarize={onSummarize}
                                            onScheduleReminder={onScheduleReminder}
                                            onCopyShortUrl={onCopyShortUrl}
                                            isSelected={selectedIds.has(bookmark.id)}
                                            onToggleSelect={onToggleSelect}
                                            selectionMode={selectedIds.size > 0}
                                            onUpdate={onUpdate}
                                        // The BookmarkCard should ideally handle both grid and list if passed a variant prop, 
                                        // but checking existing card usage.
                                        />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
