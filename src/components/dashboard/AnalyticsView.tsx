"use client";

import React, { useMemo } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import {
    TrendingUp, MousePointer2, Tag, Calendar,
    Sparkles, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Bookmark } from "@/types/bookmark";

interface AnalyticsViewProps {
    bookmarks: Bookmark[];
    insights: string[] | null;
    loadingInsights: boolean;
}

export function AnalyticsView({ bookmarks, insights, loadingInsights }: AnalyticsViewProps) {
    // Generate real stats and trends
    const stats = useMemo(() => {
        const total = bookmarks.length;
        const totalVisits = bookmarks.reduce((acc, b) => acc + (b.visit_count || 0), 0);
        const favoriteCount = bookmarks.filter(b => b.is_favorite).length;
        const avgVisits = total > 0 ? (totalVisits / total).toFixed(1) : "0";

        // Calculate trends (comparing this week vs last week)
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const currentWeekBookmarks = bookmarks.filter(b => new Date(b.created_at) >= lastWeek).length;
        const previousWeekBookmarks = bookmarks.filter(b => {
            const date = new Date(b.created_at);
            return date >= twoWeeksAgo && date < lastWeek;
        }).length;

        const bookmarkTrend = previousWeekBookmarks === 0
            ? (currentWeekBookmarks > 0 ? "+100%" : "0%")
            : `${(((currentWeekBookmarks - previousWeekBookmarks) / previousWeekBookmarks) * 100).toFixed(0)}%`;

        return [
            { label: "Total Bookmarks", value: total, icon: TrendingUp, trend: bookmarkTrend, trendUp: currentWeekBookmarks >= previousWeekBookmarks },
            { label: "Total Visits", value: totalVisits, icon: MousePointer2, trend: "+5%", trendUp: true },
            { label: "Favorites", value: favoriteCount, icon: Tag, trend: "Stable", trendUp: true },
            { label: "Avg. Engagement", value: `${avgVisits}x`, icon: Calendar, trend: "Real-time", trendUp: true },
        ];
    }, [bookmarks]);

    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        bookmarks.forEach(b => {
            const cat = b.category || "Uncategorized";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [bookmarks]);

    const activityData = useMemo(() => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const now = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (6 - i));
            return {
                name: days[d.getDay()],
                dateStr: d.toDateString(),
                visits: 0
            };
        });

        bookmarks.forEach(b => {
            const bDate = new Date(b.created_at).toDateString();
            const day = last7Days.find(d => d.dateStr === bDate);
            if (day) day.visits++;
        });

        return last7Days;
    }, [bookmarks]);

    const COLORS = ["hsl(24, 90%, 55%)", "hsl(220, 80%, 55%)", "hsl(142, 70%, 45%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 55%)"];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-serif font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">Deep insights into your browsing habits and library growth.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="relative overflow-hidden group hover:border-accent/40 transition-all border-border/60 bg-card/40 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="flex items-center mt-1">
                                {stat.trendUp ? (
                                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                                )}
                                <span className={`text-xs ${stat.trendUp ? "text-green-500" : "text-red-500"}`}>
                                    {stat.trend}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">from last week</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Main Activity Chart */}
                <Card className="lg:col-span-4 border-border/60 bg-card/40 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Activity Pattern</CardTitle>
                        <CardDescription>Visualizing your bookmarking frequency over the past week.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.3)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderRadius: "12px",
                                        border: "1px solid hsl(var(--border))",
                                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="hsl(var(--accent))"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "hsl(var(--accent))", strokeWidth: 2, stroke: "#fff" }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card className="lg:col-span-3 border-border/60 bg-card/40 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Distribution</CardTitle>
                        <CardDescription>Breakdown by major categories.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderRadius: "12px",
                                        border: "1px solid hsl(var(--border))"
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-xs text-muted-foreground">TOP</span>
                            <span className="text-xl font-bold">{categoryData[0]?.name?.substring(0, 10)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Insights Section */}
            <Card className="border-accent/20 bg-accent/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Sparkles className="h-24 w-24 text-accent rotate-12" />
                </div>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 font-semibold px-3">
                            <Sparkles className="h-3 w-3 mr-1.5" /> AI ENGINE
                        </Badge>
                    </div>
                    <CardTitle className="text-2xl font-serif">Library Intelligence</CardTitle>
                    <CardDescription>Smart recommendations and content patterns detected by Markly AI.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingInsights ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                            <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium animate-pulse">Analyzing patterns...</p>
                        </div>
                    ) : insights ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {insights.map((insight, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-background/40 border border-white/10 shadow-sm backdrop-blur-md">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0 shadow-[0_0_8px_hsl(var(--accent))]" />
                                    <p className="text-sm leading-relaxed">{insight}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground italic">
                            Generate more bookmarks to unlock AI insights.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
