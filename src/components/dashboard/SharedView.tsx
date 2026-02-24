"use client";

import React from "react";
import {
    Users, Share2, ArrowRight, UserPlus,
    MoreHorizontal, Shield, ExternalLink, Mail, Trash2
} from "lucide-react";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Collection, Bookmark } from "@/types/bookmark";

interface SharedViewProps {
    collections: Collection[];
    userId: string;
    userEmail: string;
    bookmarks: Bookmark[];
    onViewCollection: (id: string) => void;
    recentActivity?: {
        id: string;
        userName: string;
        userAvatar?: string;
        action: string;
        targetName: string;
        timestamp: string;
    }[];
}

export function SharedView({ collections, userId, userEmail, bookmarks, onViewCollection, recentActivity = [] }: SharedViewProps) {
    // Filter received collections: only show those with more than 2 bookmarks
    const receivedCollections = collections.filter(c => c.user_id !== userId && (c.bookmark_ids?.length || 0) > 2);

    // Solo collections (1-2 items) that we'll show as individual bookmarks instead
    const soloCollections = collections.filter(c => c.user_id !== userId && (c.bookmark_ids?.length || 0) <= 2);
    const soloBookmarkIds = soloCollections.flatMap(c => c.bookmark_ids || []);

    // My shared collections (owned by me, but has members or is public)
    const mySharedCollections = collections.filter(c => c.user_id === userId && (c.is_public || (c.members && c.members.length > 1)));

    // Outgoing collections that are "solo" (1-2 items)
    const mySoloCollections = mySharedCollections.filter(c => (c.bookmark_ids?.length || 0) <= 2 && !c.is_public);
    const mySoloBookmarkIds = mySoloCollections.flatMap(c => c.bookmark_ids || []);

    // Received bookmarks (explicitly shared with me OR from a received solo collection)
    const receivedBookmarks = bookmarks.filter(b => b.shared_by || soloBookmarkIds.includes(b.id));

    // Sent bookmarks (bookmarks I own that are in my outgoing solo collections)
    const sentBookmarks = bookmarks.filter(b => mySoloBookmarkIds.includes(b.id) && b.user_id === userId);

    // Combine for the tab
    const allSharedIndividualItems = [...receivedBookmarks, ...sentBookmarks];

    // For sent bookmarks count
    const sentBookmarkCount = mySharedCollections.reduce((acc, c) => acc + (c.bookmark_ids?.length || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-serif font-bold tracking-tight">Sharing Center</h1>
                <p className="text-muted-foreground">Collaborate on collections and track shared resources.</p>
            </div>

            <Tabs defaultValue="received" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-2xl h-11 mb-6">
                    <TabsTrigger value="received" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Received
                        <Badge variant="secondary" className="ml-2 bg-muted-foreground/10 h-5 px-1.5">{receivedCollections.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="outgoing" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        My Shares
                        <Badge variant="secondary" className="ml-2 bg-muted-foreground/10 h-5 px-1.5">{mySharedCollections.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="bookmarks" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Shared Bookmarks
                        <Badge variant="secondary" className="ml-2 bg-muted-foreground/10 h-5 px-1.5">{allSharedIndividualItems.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="received" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {receivedCollections.length > 0 ? (
                            receivedCollections.map((col) => (
                                <Card key={col.id} className="group hover:border-accent/40 transition-all border-border/60 bg-card/40 backdrop-blur-sm">
                                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-500/20">
                                            <Share2 className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base truncate">{col.name}</CardTitle>
                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-muted-foreground">Shared by</span>
                                                    <span className="text-[10px] font-medium text-foreground">
                                                        {col.members?.find(m => m.role === 'owner')?.name || 'Another User'} ({col.members?.find(m => m.role === 'owner')?.email})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                            {col.members?.find(m => m.id === userId)?.role || 'Viewer'}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {col.members?.slice(0, 3).map((m, i) => (
                                                    <Avatar key={i} className="h-7 w-7 border-2 border-background ring-2 ring-transparent group-hover:ring-accent/20 transition-all">
                                                        <AvatarImage src={m.avatar_url} />
                                                        <AvatarFallback className="text-[10px]">{m.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                {col.members && col.members.length > 3 && (
                                                    <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                                                        +{col.members.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => onViewCollection(col.id)} className="text-accent hover:text-accent hover:bg-accent/5">
                                                Open Collection <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground font-medium">No shared collections yet.</p>
                                <p className="text-xs text-muted-foreground mt-1">When someone shares a collection with you, it will appear here.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="outgoing" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mySharedCollections.length > 0 ? (
                            mySharedCollections.map((col) => (
                                <Card key={col.id} className="group hover:border-accent/40 transition-all border-border/60 bg-card/40 backdrop-blur-sm">
                                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/10 to-accent/10 flex items-center justify-center border border-accent/20">
                                            <Users className="h-6 w-6 text-accent" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base truncate">{col.name}</CardTitle>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] h-4 font-normal bg-accent/5 text-accent border-accent/20">
                                                        Shared
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] h-4 font-normal">
                                                        {col.is_public ? 'Public Link' : 'Invite Only'}
                                                    </Badge>
                                                    <span className="text-[10px]">• {col.members?.length || 1} Members</span>
                                                </div>
                                                {col.members && col.members.length > 1 && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground">Shared to</span>
                                                        <span className="text-[10px] font-medium text-foreground">
                                                            {col.members.filter(m => m.id !== userId)[0]?.name} ({col.members.filter(m => m.id !== userId)[0]?.email})
                                                            {col.members.length > 2 && ` +${col.members.length - 2} more`}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem className="gap-2">
                                                    <UserPlus className="h-4 w-4" /> Manage Access
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2">
                                                    <Shield className="h-4 w-4" /> Permissions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 text-destructive">
                                                    <Trash2 className="h-4 w-4" /> Stop Sharing
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs border-accent/20 hover:bg-accent/5 hover:text-accent">
                                                <Mail className="h-3.5 w-3.5 mr-2" /> Invite Member
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => onViewCollection(col.id)} className="text-accent hover:text-accent hover:bg-accent/5">
                                                View <ExternalLink className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                                <Share2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground font-medium">You haven't shared anything yet.</p>
                                <Button className="mt-4 rounded-full bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 gap-2">
                                    <UserPlus className="h-4 w-4" /> Share a Collection
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="bookmarks" className="mt-0">
                    <div className="space-y-4">
                        {allSharedIndividualItems.length > 0 ? (
                            allSharedIndividualItems.map((bk) => {
                                const isReceived = bk.user_id !== userId || bk.shared_by;
                                let recipientInfo = "";
                                if (!isReceived) {
                                    const parentCol = mySoloCollections.find(c => c.bookmark_ids.includes(bk.id));
                                    const primaryRecipient = parentCol?.members.find(m => m.id !== userId);
                                    recipientInfo = primaryRecipient ? `${primaryRecipient.name} (${primaryRecipient.email})` : "Collaborators";
                                }

                                return (
                                    <Card key={bk.id} className="group hover:border-accent/40 transition-all border-border/60 bg-card/40 backdrop-blur-sm">
                                        <CardContent className="flex items-center gap-4 p-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                                {bk.favicon_url ? (
                                                    <img src={bk.favicon_url} alt="" className="h-5 w-5 object-contain rounded-sm" />
                                                ) : (
                                                    <Share2 className="h-5 w-5 text-blue-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <a href={bk.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm truncate block hover:text-accent transition-colors">
                                                    {bk.title}
                                                </a>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {isReceived ? "Shared by" : "Shared to"}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 bg-blue-500/5 text-blue-500 border-blue-500/15 font-normal">
                                                        {isReceived ? bk.shared_by || "Unknown" : recipientInfo}
                                                    </Badge>
                                                    {bk.category && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 font-normal">
                                                            {bk.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <a href={bk.url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-accent">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                                <Share2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground font-medium">No shared bookmarks yet.</p>
                                <p className="text-xs text-muted-foreground mt-1">When someone shares bookmarks with you, they&apos;ll appear here.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Activity Feed / Quick Insights */}
            <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Collaborations</CardTitle>
                    <CardDescription>Latest updates from shared collections.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-4 text-sm p-3 rounded-2xl hover:bg-muted/30 transition-colors border border-transparent hover:border-white/10">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={activity.userAvatar} />
                                    <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                                        {activity.userName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">
                                        {activity.userName} <span className="text-muted-foreground font-normal">{activity.action}</span> &ldquo;{activity.targetName}&rdquo;
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {new Date(activity.timestamp).toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-muted-foreground italic text-sm">
                            No recent collaboration activity detected.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
