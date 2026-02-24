"use client";

import React from "react";
import {
    Home, Star, FolderOpen, BarChart3, Users, Settings, Bookmark
} from "lucide-react";
import type { ViewMode } from "@/types/bookmark";

interface SidebarProps {
    viewMode: ViewMode;
    setViewMode: (v: ViewMode) => void;
    bookmarkCount: number;
    favCount: number;
    collectionCount: number;
    hasNewShares?: boolean;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export const Sidebar = React.memo(function Sidebar({
    viewMode,
    setViewMode,
    bookmarkCount,
    favCount,
    collectionCount,
    hasNewShares,
    isOpen,
    setIsOpen,
}: SidebarProps) {
    const navItems: { icon: any; label: string; value: ViewMode; count?: number }[] = [
        { icon: Home, label: "All Bookmarks", value: "bookmarks", count: bookmarkCount },
        { icon: Star, label: "Favorites", value: "favorites", count: favCount },
        { icon: FolderOpen, label: "Collections", value: "collections", count: collectionCount },
        { icon: BarChart3, label: "Analytics", value: "analytics" },
        { icon: Users, label: "Shared", value: "shared" },
        { icon: Settings, label: "Settings", value: "settings" },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-background/80 backdrop-blur-xl border-r border-border/40 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
            `} aria-label="Main Sidebar">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5 text-accent" aria-hidden="true" />
                        <span className="text-xl font-serif tracking-tight">Markly</span>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = viewMode === item.value;
                        return (
                            <button
                                key={item.value}
                                onClick={() => {
                                    setViewMode(item.value);
                                    setIsOpen(false);
                                }}
                                aria-current={isActive ? "page" : undefined}
                                aria-label={`${item.label} (${item.count ?? 0})`}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-accent text-white shadow-md shadow-accent/20"
                                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" aria-hidden="true" />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.count !== undefined && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-muted"
                                        }`}>
                                        {item.count}
                                    </span>
                                )}
                                {item.value === "shared" && hasNewShares && (
                                    <span className="relative flex h-2.5 w-2.5 ml-auto">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
});
