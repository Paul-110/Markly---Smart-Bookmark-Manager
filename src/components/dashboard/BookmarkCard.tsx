"use client";

import React, { useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import {
    MoreHorizontal, Heart, Trash2, Edit, Share2,
    ExternalLink, Copy, Calendar, Sparkles, GripVertical, Pencil, Globe
} from "lucide-react";
import type { Bookmark } from "@/types/bookmark";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface BookmarkCardProps {
    bookmark: Bookmark;
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (bookmark: Bookmark) => void;
    onShare: (bookmark: Bookmark) => void;
    onSummarize: (id: string) => void;
    onScheduleReminder: (id: string, type: 'later' | 'tomorrow' | 'weekend' | 'next-week') => void;
    onCopyShortUrl: (id: string) => void;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    selectionMode: boolean;
    className?: string;
    dragHandleProps?: any;
    onUpdate?: (id: string, updates: Partial<Bookmark>) => void;
}

export const BookmarkCard = React.memo(function BookmarkCard({
    bookmark,
    onToggleFavorite,
    onDelete,
    onEdit,
    onShare,
    onSummarize,
    onScheduleReminder,
    onCopyShortUrl,
    isSelected,
    onToggleSelect,
    selectionMode,
    className,
    dragHandleProps,
    onUpdate
}: BookmarkCardProps) {
    const [imageError, setImageError] = useState(false);
    const [faviconError, setFaviconError] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [tempTitle, setTempTitle] = useState(bookmark.title);

    const domain = useMemo(() => {
        try {
            return new URL(bookmark.url).hostname.replace(/^www\./, '');
        } catch {
            return bookmark.url;
        }
    }, [bookmark.url]);

    const handleRename = () => {
        if (!tempTitle.trim() || tempTitle === bookmark.title) {
            setIsRenaming(false);
            setTempTitle(bookmark.title);
            return;
        }
        if (onUpdate) onUpdate(bookmark.id, { title: tempTitle });
        setIsRenaming(false);
    };

    return (
        <Card className={cn(
            "group relative flex flex-col h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-border/60 overflow-hidden",
            isSelected && "ring-2 ring-accent border-accent bg-accent/5",
            className
        )}>
            {/* Selection Checkbox (Visible on hover or selection mode) */}
            <div className={cn(
                "absolute top-2 left-2 z-30 transition-opacity duration-200",
                selectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
            )}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(bookmark.id)}
                    className="bg-background/80 backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
            </div>

            {/* Drag Handle (Top Right) */}
            {dragHandleProps && (
                <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <div
                        {...dragHandleProps}
                        className="p-1.5 rounded-md cursor-grab active:cursor-grabbing bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </div>
                </div>
            )}

            {/* Image / Preview */}
            <div className="relative aspect-[1.91/1] w-full overflow-hidden bg-muted/30 border-b border-border/40">
                {bookmark.og_image_url && !imageError ? (
                    <img
                        src={bookmark.og_image_url}
                        alt={bookmark.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted text-muted-foreground/40">
                        <Globe className="h-8 w-8 opacity-20" />
                    </div>
                )}
            </div>

            <CardContent className="flex-1 p-3 flex flex-col gap-1.5">
                {/* Domain & Favicon */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {bookmark.favicon_url && !faviconError ? (
                            <img
                                src={bookmark.favicon_url}
                                alt=""
                                className="h-3.5 w-3.5 rounded-sm object-contain shrink-0 opacity-70"
                                onError={() => setFaviconError(true)}
                            />
                        ) : (
                            <Globe className="h-3 w-3 text-muted-foreground/50" />
                        )}
                        <span className="text-[11px] text-muted-foreground truncate font-medium">
                            {domain}
                        </span>
                    </div>
                    {bookmark.category && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 border-border/50 text-muted-foreground shrink-0 font-normal">
                            {bookmark.category}
                        </Badge>
                    )}
                    {bookmark.shared_by && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0 font-normal cursor-default">
                                    Shared
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                Shared by {bookmark.shared_by}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {/* Title */}
                <div>
                    {isRenaming ? (
                        <Input
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                                if (e.key === "Escape") {
                                    setIsRenaming(false);
                                    setTempTitle(bookmark.title);
                                }
                            }}
                            className="h-6 text-sm font-semibold px-1 -ml-1"
                            autoFocus
                            aria-label="Rename bookmark"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sm leading-snug hover:text-accent transition-colors line-clamp-2 block text-foreground"
                            title={bookmark.title}
                        >
                            {bookmark.title}
                        </a>
                    )}
                </div>

                {/* Description (Optional - hidden on very small cards if needed, but good for context) */}
                {bookmark.description && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed cursor-default">
                                {bookmark.description}
                            </p>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-[260px] text-xs">
                            {bookmark.description}
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Tags */}
                {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 mt-auto">
                        {bookmark.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-foreground border border-border/50">
                                #{tag}
                            </span>
                        ))}
                        {bookmark.tags.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                                +{bookmark.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-2 px-3 flex items-center justify-between border-t border-border/40 bg-muted/5 h-10">
                <div className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-7 w-7 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors",
                            bookmark.is_favorite ? "text-red-500 fill-current" : "text-muted-foreground"
                        )}
                        onClick={() => onToggleFavorite(bookmark.id)}
                        title="Toggle Favorite"
                    >
                        <Heart className={cn("h-4 w-4", bookmark.is_favorite && "fill-current")} />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => window.open(bookmark.url, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" /> Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCopyShortUrl(bookmark.id)}>
                                <Copy className="h-4 w-4 mr-2" /> Copy Short Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setTempTitle(bookmark.title);
                                setIsRenaming(true);
                            }}>
                                <Pencil className="h-4 w-4 mr-2" /> Quick Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(bookmark)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShare(bookmark)}>
                                <Share2 className="h-4 w-4 mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSummarize(bookmark.id)}>
                                <Sparkles className="h-4 w-4 mr-2" /> AI Summary
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => onScheduleReminder(bookmark.id, 'tomorrow')}>
                                <Calendar className="h-4 w-4 mr-2" /> Remind Tomorrow
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => onDelete(bookmark.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardFooter>
        </Card>
    );
});

export function SortableBookmarkCard(props: BookmarkCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.bookmark.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <BookmarkCard
                {...props}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

export const BookmarkListRow = React.memo(function BookmarkListRow({
    bookmark,
    onToggleFavorite,
    onDelete,
    onEdit,
    onShare,
    onSummarize,
    onScheduleReminder,
    onCopyShortUrl,
    isSelected,
    onToggleSelect,
    selectionMode,
    className,
    dragHandleProps,
    onUpdate
}: BookmarkCardProps) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [faviconError, setFaviconError] = useState(false);
    const [tempTitle, setTempTitle] = useState(bookmark.title);

    const domain = useMemo(() => {
        try {
            return new URL(bookmark.url).hostname.replace(/^www\./, '');
        } catch {
            return bookmark.url;
        }
    }, [bookmark.url]);

    const handleRename = () => {
        if (!tempTitle.trim() || tempTitle === bookmark.title) {
            setIsRenaming(false);
            setTempTitle(bookmark.title);
            return;
        }
        if (onUpdate) onUpdate(bookmark.id, { title: tempTitle });
        setIsRenaming(false);
    };

    return (
        <div className={cn(
            "group flex items-center gap-3 p-2 rounded-xl border border-transparent hover:bg-card hover:border-border/50 hover:shadow-sm transition-all bg-transparent",
            isSelected && "bg-accent/5 border-accent/20 hover:bg-accent/10",
            className
        )}>
            {/* Drag Handle */}
            <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing text-muted-foreground/20 hover:text-foreground p-1"
            >
                <GripVertical className="h-4 w-4" />
            </div>

            {/* Checkbox */}
            <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(bookmark.id)}
                className={cn("mr-1", !isSelected && "opacity-0 group-hover:opacity-100 transition-opacity")}
            />

            {/* Favicon */}
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden shrink-0 border border-border/20">
                {bookmark.favicon_url && !faviconError ? (
                    <img src={bookmark.favicon_url} alt="" className="h-5 w-5 object-contain" onError={() => setFaviconError(true)} />
                ) : (
                    <span className="text-sm font-serif opacity-50">{domain.charAt(0).toUpperCase()}</span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5 min-w-0">
                    {isRenaming ? (
                        <Input
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                                if (e.key === "Escape") {
                                    setIsRenaming(false);
                                    setTempTitle(bookmark.title);
                                }
                            }}
                            className="h-7 text-sm font-medium px-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Rename bookmark"
                        />
                    ) : (
                        <div className="flex flex-col">
                            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm truncate hover:text-accent transition-colors">
                                {bookmark.title}
                            </a>
                            <span className="text-[11px] text-muted-foreground truncate">{domain}</span>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex md:col-span-3 gap-1 flex-wrap">
                    {bookmark.category && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50 border-border/50 text-muted-foreground">
                            {bookmark.category}
                        </Badge>
                    )}
                    {bookmark.shared_by && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-blue-500/10 text-blue-500 border-blue-500/20 cursor-default">
                                    Shared
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                Shared by {bookmark.shared_by}
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {bookmark.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/30">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="hidden md:block md:col-span-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                </div>

                <div className="hidden md:flex md:col-span-2 justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onToggleFavorite(bookmark.id)}>
                        <Heart className={cn("h-3.5 w-3.5", bookmark.is_favorite && "fill-red-500 text-red-500")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onEdit(bookmark)}>
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onCopyShortUrl(bookmark.id)}><Copy className="h-4 w-4 mr-2" /> Copy Link</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setTempTitle(bookmark.title); setIsRenaming(true); }}><Pencil className="h-4 w-4 mr-2" /> Rename</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShare(bookmark)}><Share2 className="h-4 w-4 mr-2" /> Share</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(bookmark.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
});

export function SortableBookmarkListRow(props: BookmarkCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.bookmark.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <BookmarkListRow
                {...props}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}