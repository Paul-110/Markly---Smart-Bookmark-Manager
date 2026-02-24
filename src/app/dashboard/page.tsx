"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bookmark, Search, LayoutGrid, List, Plus,
    MoreHorizontal, Filter, Trash2,
    ArrowUpDown, CheckSquare, Menu, Home, Sparkles, Loader2, Share2, LogOut, Sun, Moon
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useBookmarks, notifyOtherTabs } from "@/hooks/use-bookmarks";
import { useCollections } from "@/hooks/use-collections";
import type { Bookmark as BookmarkType, Collection, ViewMode, SortOption } from "@/types/bookmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
} from "@dnd-kit/sortable";

// Custom Components
const AnalyticsView = dynamic(() => import("@/components/dashboard/AnalyticsView").then(mod => mod.AnalyticsView), { ssr: false });
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BookmarkCard, SortableBookmarkCard, SortableBookmarkListRow } from "@/components/dashboard/BookmarkCard";
import { SharedView } from "@/components/dashboard/SharedView";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { CollectionDetailView } from "@/components/dashboard/CollectionDetailView";

// Actions
import { importCollection } from "@/app/actions/import-collection";

// Dynamic Imports for Dialogs (Performance)
const ShareCollectionDialog = dynamic(() => import("@/components/dashboard/ShareCollectionDialog").then(mod => mod.ShareCollectionDialog), { ssr: false });
const AICollectionDialog = dynamic(() => import("@/components/dashboard/AICollectionDialog").then(mod => mod.AICollectionDialog), { ssr: false });
const SummaryDialog = dynamic(() => import("@/components/dashboard/SummaryDialog").then(mod => mod.SummaryDialog), { ssr: false });
const CreateCollectionDialog = dynamic(() => import("@/components/dashboard/CreateCollectionDialog").then(mod => mod.CreateCollectionDialog), { ssr: false });
const ShareBookmarkDialog = dynamic(() => import("@/components/dashboard/ShareBookmarkDialog").then(mod => mod.ShareBookmarkDialog), { ssr: false });
const AddBookmarkDialog = dynamic(() => import("@/components/dashboard/AddBookmarkDialog").then(mod => mod.AddBookmarkDialog), { ssr: false });
const EditBookmarkDialog = dynamic(() => import("@/components/dashboard/EditDialogs").then(mod => mod.EditBookmarkDialog), { ssr: false });
const BulkEditDialog = dynamic(() => import("@/components/dashboard/EditDialogs").then(mod => mod.BulkEditDialog), { ssr: false });
const MultiShareDialog = dynamic(() => import("@/components/dashboard/MultiShareDialog").then(mod => mod.MultiShareDialog), { ssr: false });

// Actions
import { scheduleReminder } from "@/app/actions/smart-schedule";
import { SelectionBar } from "@/components/dashboard/SelectionBar";
import { recordVisit } from "@/app/actions/record-visit";
import { generateShortUrl } from "@/app/actions/shorten-url";
import { generateAIInsights } from "@/app/actions/ai-insights";
import { shareBookmark } from "@/app/actions/share-actions";
import { RealtimeDashboardUpdater } from "@/components/RealtimeDashboardUpdater";

export default function DashboardPage() {
    const router = useRouter();
    const { user, session, loading: authLoading, signOut, updateMetadata } = useAuth();
    const { theme, setTheme } = useTheme();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const tabId = useMemo(() => Math.random().toString(36).substring(2, 11), []);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
        if (user?.id) {
            notifyOtherTabs(user.id, tabId);
        }
    }, [user?.id, tabId]);

    const {
        bookmarks, filtered, isLoading, searchQuery, setSearchQuery,
        sortBy, setSortBy, categories, selectedCategory, setSelectedCategory,
        addBookmark, editBookmark, removeBookmark, toggleFavorite,
        selectedIds, toggleSelect, selectAll, clearSelection, deleteSelected, bulkEdit, reorder,
    } = useBookmarks(user?.id, refreshTrigger, tabId);
    const { collections, reorderCollectionBookmarks, createCollection, removeCollection } = useCollections(user?.id, refreshTrigger);

    const [viewMode, setViewMode] = useState<ViewMode>("bookmarks");
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [listLayout, setListLayout] = useState<"grid" | "list">("grid");
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
    const [createCollectionDialogOpen, setCreateCollectionDialogOpen] = useState(false);
    const [multiShareDialogOpen, setMultiShareDialogOpen] = useState(false);
    const [hasNewShares, setHasNewShares] = useState(false);

    const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = useCallback((event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (active.id !== over?.id) {
            if (viewMode === "collections" && selectedCollectionId) {
                reorderCollectionBookmarks(selectedCollectionId, active.id, over.id);
            } else {
                reorder(active.id, over.id);
            }
        }
    }, [reorder, reorderCollectionBookmarks, viewMode, selectedCollectionId, router]);

    const handleDragStart = useCallback((event: any) => setActiveId(event.active.id), []);

    const handleAddBookmark = useCallback(async (input: { url: string; title?: string; description?: string; category?: string; tags?: string[]; favicon_url?: string; og_image_url?: string; is_favorite?: boolean }) => {
        const result = await addBookmark(input);
        if (result) {
            setNewlyAddedId(result.id);
            setTimeout(() => setNewlyAddedId(null), 3000);
        }
        return result;
    }, [addBookmark]);

    // Derived state
    const displayedBookmarks = useMemo(() => {
        let items = filtered;
        // In main views, only show bookmarks owned by the user (avoids duplicates from shared collections)
        if (user && (viewMode === "bookmarks" || viewMode === "favorites")) {
            items = items.filter(b => b.user_id === user.id);
        }
        if (viewMode === "favorites") return items.filter((b) => b.is_favorite);
        return items;
    }, [filtered, viewMode, user]);

    const favCount = useMemo(() => bookmarks.filter((b) => b.is_favorite && b.user_id === user?.id).length, [bookmarks, user?.id]);

    const handleSignOut = useCallback(async () => {
        await signOut();
        router.push("/");
    }, [signOut, router]);

    const handleSetViewMode = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        if (mode === "shared") {
            setHasNewShares(false);
        }
        if (mode !== "collections") {
            setSelectedCollectionId(null);
        }
    }, []);

    const handleImportCollection = useCallback(async (collection: Collection) => {
        toast.promise(importCollection(collection.id), {
            loading: "Importing collection...",
            success: (data) => {
                if (data.error) throw new Error(data.error);
                setRefreshTrigger(prev => prev + 1);
                return "Collection imported successfully!";
            },
            error: (err) => err.message || "Failed to import collection",
        });
    }, []);

    const handleCopyShortUrl = useCallback(async (id: string) => {
        try {
            const result = await generateShortUrl(id);
            const fullUrl = `${window.location.origin}${result.shortUrl}`;
            await navigator.clipboard.writeText(fullUrl);
            toast.success("Shortened URL copied!", {
                description: fullUrl,
                duration: 4000,
            });
        } catch (err: any) {
            toast.error(err.message || "Failed to generate short link");
        }
    }, []);

    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [summaryBookmarkId, setSummaryBookmarkId] = useState<string | null>(null);
    const summaryBookmark = useMemo(() => bookmarks.find(b => b.id === summaryBookmarkId) || null, [bookmarks, summaryBookmarkId]);

    const handleSummarize = useCallback((id: string) => {
        setSummaryBookmarkId(id);
        setSummaryDialogOpen(true);
    }, []);

    const handleScheduleReminder = useCallback(async (id: string, type: any) => {
        toast.promise(scheduleReminder(id, type), {
            loading: "Scheduling reminder...",
            success: "Reminder scheduled!",
            error: "Failed to schedule reminder",
        });
    }, []);

    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [collectionToShare, setCollectionToShare] = useState<Collection | null>(null);
    const [shareBookmarkDialogOpen, setShareBookmarkDialogOpen] = useState(false);
    const [bookmarkToShare, setBookmarkToShare] = useState<BookmarkType | null>(null);

    const onShare = useCallback((bookmark: BookmarkType) => {
        setBookmarkToShare(bookmark);
        setShareBookmarkDialogOpen(true);
    }, []);

    const selectedCollection = useMemo(() => collections.find(c => c.id === selectedCollectionId), [collections, selectedCollectionId]);

    const [aiInsights, setAiInsights] = useState<string[] | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    const myBookmarks = useMemo(() => bookmarks.filter(b => b.user_id === user?.id), [bookmarks, user?.id]);

    useEffect(() => {
        if (viewMode === "analytics" && !aiInsights && myBookmarks.length > 0) {
            setLoadingInsights(true);
            generateAIInsights(myBookmarks)
                .then(setAiInsights)
                .finally(() => setLoadingInsights(false));
        }
    }, [viewMode, myBookmarks, aiInsights]);

    const sharedCollections = useMemo(() => collections.filter(c => c.user_id !== user?.id), [collections, user?.id]);
    const myCollections = useMemo(() => collections.filter(c => c.user_id === user?.id), [collections, user?.id]);

    const collectionBookmarks = useMemo(() => {
        if (!selectedCollection) return [];
        return (selectedCollection.bookmark_ids || [])
            .map(id => bookmarks.find(b => b.id === id))
            .filter((b): b is BookmarkType => !!b);
    }, [selectedCollection, bookmarks]);

    const sharedActivity = useMemo(() => {
        const sharedCols = collections.filter(c =>
            c.user_id !== user?.id || (c.members && c.members.length > 1) || c.is_public
        );

        const activity = sharedCols.flatMap(col => {
            return (col.bookmark_ids || [])
                .map(id => bookmarks.find(b => b.id === id))
                .filter((b): b is BookmarkType => !!b)
                .map(b => ({
                    id: `${col.id}-${b.id}`,
                    userName: col.user_id === user?.id ? "You" : col.members?.find(m => m.role === 'owner')?.name || "User",
                    userAvatar: col.members?.find(m => m.role === 'owner')?.avatar_url,
                    action: "added a bookmark to",
                    targetName: col.name,
                    timestamp: b.created_at
                }));
        });

        return activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    }, [collections, bookmarks, user?.id]);

    // Accessibility Effect (Keyboard shortcut for Search)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                document.getElementById("search-input")?.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    if (authLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-ambient-site">
                <div role="status" className="text-center space-y-4">
                    <Bookmark className="h-8 w-8 text-accent mx-auto animate-pulse" aria-hidden="true" />
                    <p className="text-muted-foreground">Loading dashboard…</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex h-screen text-foreground">
                <RealtimeDashboardUpdater
                    userId={user.id}
                    onNewShare={() => setHasNewShares(true)}
                    onUpdate={() => setRefreshTrigger(c => c + 1)}
                />
                <Sidebar
                    viewMode={viewMode}
                    setViewMode={handleSetViewMode}
                    bookmarkCount={bookmarks.filter(b => b.user_id === user.id).length}
                    favCount={favCount}
                    collectionCount={myCollections.length}
                    hasNewShares={hasNewShares}
                    isOpen={mobileMenuOpen}
                    setIsOpen={setMobileMenuOpen}
                />

                <div className="flex-1 flex flex-col min-w-0" role="main">
                    <header className="h-16 flex items-center px-4 gap-4 sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/40">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle Menu"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        {(viewMode === "bookmarks" || viewMode === "favorites" || viewMode === "collections") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={selectedIds.size > 0 ? clearSelection : selectAll}
                                aria-pressed={selectedIds.size === displayedBookmarks.length}
                                className={selectedIds.size > 0 ? "text-accent" : "text-muted-foreground"}
                            >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                {selectedIds.size > 0 ? "Deselect All" : "Select All"}
                            </Button>
                        )}

                        <div className="flex-1 max-w-xl relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <Input
                                id="search-input"
                                name="search-bookmarks"
                                placeholder="Search bookmarks... (Ctrl+K)"
                                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/50 focus:border-accent/40 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search Bookmarks"
                                autoComplete="off"
                            />
                        </div>

                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl hidden sm:flex">
                            <Button
                                variant={listLayout === "grid" ? "secondary" : "ghost"}
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() => setListLayout("grid")}
                                aria-label="Grid View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={listLayout === "list" ? "secondary" : "ghost"}
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() => setListLayout("list")}
                                aria-label="List View"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                <SelectTrigger className="w-[140px] h-10 hidden sm:flex" aria-label="Sort Bookmarks">
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="oldest">Oldest</SelectItem>
                                    <SelectItem value="alphabetical">A → Z</SelectItem>
                                    <SelectItem value="most-visited">Most Visited</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}>
                                <SelectTrigger className="w-[140px] h-10 hidden md:flex" aria-label="Filter by Category">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                        className="rounded-xl h-10 w-10 overflow-hidden"
                                        aria-label="Toggle Theme"
                                    >
                                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Toggle Theme</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleSignOut}
                                        className="rounded-xl h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        aria-label="Log out"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Log out</TooltipContent>
                            </Tooltip>
                        </div>
                    </header>
                    <RealtimeDashboardUpdater
                        userId={user?.id}
                        tabId={tabId}
                        onUpdate={() => setRefreshTrigger(prev => prev + 1)}
                        onNewShare={() => setHasNewShares(true)}
                    />
                    <main className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {viewMode === "bookmarks" || viewMode === "favorites" ? (
                                <motion.div
                                    key="bookmarks-grid"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-serif font-bold">
                                            {viewMode === "favorites" ? "Favorites" : "All Bookmarks"}
                                        </h1>
                                        <Button onClick={() => setAddDialogOpen(true)} className="rounded-full bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 gap-2">
                                            <Bookmark className="h-4 w-4" /> Add New
                                        </Button>
                                    </div>

                                    {isLoading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                                <Card key={i} className="animate-pulse h-40" />
                                            ))}
                                        </div>
                                    ) : displayedBookmarks.length === 0 ? (
                                        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                                            <p className="text-muted-foreground">No bookmarks found.</p>
                                        </div>
                                    ) : (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={displayedBookmarks.map(b => b.id)}
                                                strategy={rectSortingStrategy}
                                                disabled={!sortBy.includes("custom")}
                                            >
                                                <div
                                                    className={listLayout === "grid" ? "grid gap-4 pb-10" : "flex flex-col gap-1 pb-10"}
                                                    style={listLayout === "grid" ? { gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" } : undefined}
                                                >
                                                    {displayedBookmarks.map((bookmark) => (
                                                        <motion.div
                                                            key={bookmark.id}
                                                            initial={bookmark.id === newlyAddedId ? { opacity: 0, y: 20, scale: 0.95 } : false}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                                            className={listLayout === "grid" ? "h-full" : ""}
                                                        >
                                                            {listLayout === "grid" ? (
                                                                <SortableBookmarkCard
                                                                    bookmark={bookmark}
                                                                    onToggleFavorite={toggleFavorite}
                                                                    onDelete={removeBookmark}
                                                                    onEdit={setEditingBookmark}
                                                                    onShare={onShare}
                                                                    onSummarize={handleSummarize}
                                                                    onScheduleReminder={handleScheduleReminder}
                                                                    onCopyShortUrl={handleCopyShortUrl}
                                                                    isSelected={selectedIds.has(bookmark.id)}
                                                                    onToggleSelect={toggleSelect}
                                                                    selectionMode={selectedIds.size > 0}
                                                                    className={bookmark.id === newlyAddedId ? "ring-2 ring-accent ring-offset-2 bg-accent/10 transition-all duration-1000" : undefined}
                                                                    onUpdate={editBookmark}
                                                                />
                                                            ) : (
                                                                <SortableBookmarkListRow
                                                                    bookmark={bookmark}
                                                                    onToggleFavorite={toggleFavorite}
                                                                    onDelete={removeBookmark}
                                                                    onEdit={setEditingBookmark}
                                                                    onShare={onShare}
                                                                    onSummarize={handleSummarize}
                                                                    onScheduleReminder={handleScheduleReminder}
                                                                    onCopyShortUrl={handleCopyShortUrl}
                                                                    isSelected={selectedIds.has(bookmark.id)}
                                                                    onToggleSelect={toggleSelect}
                                                                    selectionMode={selectedIds.size > 0}
                                                                    className={bookmark.id === newlyAddedId ? "ring-2 ring-accent ring-offset-2 bg-accent/10 transition-all duration-1000" : undefined}
                                                                    onUpdate={editBookmark}
                                                                />
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    )}
                                </motion.div>
                            ) : viewMode === "collections" ? (
                                <motion.div
                                    key="collections-view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    {selectedCollection ? (
                                        <CollectionDetailView
                                            collection={selectedCollection}
                                            bookmarks={collectionBookmarks}
                                            onBack={() => setSelectedCollectionId(null)}
                                            onAddBookmark={() => setAddDialogOpen(true)}
                                            onImport={handleImportCollection}
                                            isOwner={selectedCollection?.user_id === user?.id}
                                            userId={user?.id || ""}
                                            onDeleteCollection={(id: string) => {
                                                removeCollection(id);
                                                setSelectedCollectionId(null);
                                            }}
                                            layout={listLayout}
                                            onToggleFavorite={toggleFavorite}
                                            onDelete={removeBookmark}
                                            onEdit={setEditingBookmark}
                                            onShare={onShare}
                                            onSummarize={handleSummarize}
                                            onScheduleReminder={handleScheduleReminder}
                                            onCopyShortUrl={handleCopyShortUrl}
                                            selectedIds={selectedIds}
                                            onToggleSelect={toggleSelect}
                                            onUpdate={editBookmark}
                                        />
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h1 className="text-2xl font-serif font-bold">Collections</h1>
                                                    <p className="text-xs text-muted-foreground">Manage and organize your personal and shared collections.</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => setAiDialogOpen(true)}
                                                        variant="outline"
                                                        className="rounded-full gap-2 border-accent/20 hover:bg-accent/5 text-accent"
                                                    >
                                                        <Sparkles className="h-4 w-4" /> Organize with AI
                                                    </Button>
                                                    <Button onClick={() => setCreateCollectionDialogOpen(true)} variant="outline" className="rounded-full gap-2 border-accent/20 hover:bg-accent/5">
                                                        <Plus className="h-4 w-4 text-accent" /> New Collection
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                                {myCollections.map((c) => {
                                                    const isOwner = c.user_id === user.id;
                                                    const owner = c.members?.find(m => m.role === 'owner');
                                                    const otherMembers = c.members?.filter(m => m.id !== user.id);
                                                    const isShared = (c.members && c.members.length > 1) || c.is_public;

                                                    return (
                                                        <Card
                                                            key={c.id}
                                                            className="group cursor-pointer hover:border-accent/40 transition-all border-border/60 bg-card/40 flex flex-col justify-between"
                                                            onClick={() => setSelectedCollectionId(c.id)}
                                                        >
                                                            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                                                                <div className="flex flex-col gap-1 min-w-0">
                                                                    <CardTitle className="text-sm font-medium truncate">{c.name}</CardTitle>
                                                                    {isShared && (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            <Badge variant="outline" className="w-fit text-[9px] h-3.5 px-1 py-0 bg-accent/5 text-accent border-accent/20 font-normal">
                                                                                Shared
                                                                            </Badge>
                                                                            {!isOwner && owner && (
                                                                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                                                    Shared by {owner.name} ({owner.email})
                                                                                </span>
                                                                            )}
                                                                            {isOwner && otherMembers && otherMembers.length > 0 && (
                                                                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                                                    Shared to {otherMembers[0].name} ({otherMembers[0].email})
                                                                                    {otherMembers.length > 1 && ` +${otherMembers.length - 1} more`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCollectionToShare(c);
                                                                        setShareDialogOpen(true);
                                                                    }}>
                                                                        <Share2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    {isOwner && (
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive hover:bg-destructive/10" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeCollection(c.id);
                                                                        }}>
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="px-4 pb-4">
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <Bookmark className="h-3 w-3" />
                                                                    <span>{c.bookmark_ids.length} items</span>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ) : viewMode === "analytics" ? (
                                <AnalyticsView
                                    bookmarks={myBookmarks}
                                    insights={aiInsights}
                                    loadingInsights={loadingInsights}
                                />
                            ) : viewMode === "shared" ? (
                                <SharedView
                                    collections={collections}
                                    userId={user.id}
                                    userEmail={user.email || ''}
                                    bookmarks={bookmarks}
                                    recentActivity={sharedActivity}
                                    onViewCollection={(id) => {
                                        setSelectedCollectionId(id);
                                        setViewMode("collections");
                                    }}
                                />
                            ) : viewMode === "settings" ? (
                                <SettingsView
                                    user={user}
                                    session={session}
                                    onSignOut={handleSignOut}
                                    onUpdateMetadata={updateMetadata}
                                />
                            ) : (
                                <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
                                    Feature coming soon...
                                </div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>

                <SelectionBar
                    count={selectedIds.size}
                    onClear={clearSelection}
                    onDelete={deleteSelected}
                    onShare={() => setMultiShareDialogOpen(true)}
                />

                {/* Performance optimized lazy dialogs */}
                {addDialogOpen && (
                    <AddBookmarkDialog
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        onAdd={handleAddBookmark}
                        existingBookmarks={bookmarks}
                    />
                )}
                {editingBookmark && (
                    <EditBookmarkDialog
                        bookmark={editingBookmark}
                        open={!!editingBookmark}
                        onOpenChange={(v) => !v && setEditingBookmark(null)}
                        onSave={editBookmark}
                    />
                )}
                {bulkEditDialogOpen && (
                    <BulkEditDialog
                        open={bulkEditDialogOpen}
                        onOpenChange={setBulkEditDialogOpen}
                        onSave={bulkEdit}
                        count={selectedIds.size}
                    />
                )}
                {summaryDialogOpen && summaryBookmark && (
                    <SummaryDialog
                        bookmark={summaryBookmark}
                        open={summaryDialogOpen}
                        onOpenChange={setSummaryDialogOpen}
                    />
                )}
                {shareBookmarkDialogOpen && bookmarkToShare && (
                    <ShareBookmarkDialog
                        bookmark={bookmarkToShare}
                        open={shareBookmarkDialogOpen}
                        onOpenChange={setShareBookmarkDialogOpen}
                        onSuccess={handleRefresh}
                    />
                )}
                {shareDialogOpen && collectionToShare && (
                    <ShareCollectionDialog
                        collection={collectionToShare}
                        open={shareDialogOpen}
                        onOpenChange={setShareDialogOpen}
                        onSuccess={handleRefresh}
                    />
                )}
                {createCollectionDialogOpen && (
                    <CreateCollectionDialog
                        open={createCollectionDialogOpen}
                        onOpenChange={setCreateCollectionDialogOpen}
                        onCreate={createCollection}
                    />
                )}
                {multiShareDialogOpen && (
                    <MultiShareDialog
                        open={multiShareDialogOpen}
                        onOpenChange={setMultiShareDialogOpen}
                        bookmarks={bookmarks}
                        selectedIds={selectedIds}
                        clearSelection={clearSelection}
                        onSuccess={handleRefresh}
                    />
                )}
            </div>
        </TooltipProvider>
    );
}
