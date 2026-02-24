import React from "react";
import { FolderGit2, Sparkles, Share2, Database, BrainCircuit, Search } from "lucide-react";

const allFeatures = [
    {
        icon: Database,
        title: "Capture Everything",
        desc: "Save articles, videos, and threads with a single click parsing."
    },
    {
        icon: FolderGit2,
        title: "Smart Organization",
        desc: "Auto-categorize with AI-powered tagging and nested folders."
    },
    {
        icon: BrainCircuit,
        title: "AI Optimization",
        desc: "Models analyze content to auto-tag and summarize key insights."
    },
    {
        icon: Sparkles,
        title: "Visual Previews",
        desc: "Transform dull links into rich, visual cards for easy browsing."
    },
    {
        icon: Search,
        title: "Instant Retrieval",
        desc: "Find exactly what you need with fast semantic-powered search."
    },
    {
        icon: Share2,
        title: "Collaborative Spaces",
        desc: "Share collections and curate knowledge together in real-time."
    },
];

export function WhyMarklySection() {
    return (
        <section className="relative mx-auto w-[90%] md:w-10/12 max-w-[1400px] mb-24 md:mb-32">
            <div className="flex flex-col items-center gap-12 md:gap-16">

                {/* Heading */}
                <div className="flex flex-col items-center text-center gap-4 w-full">
                    <h2 className="font-season-mix text-3xl md:text-[42px] text-foreground tracking-tight">
                        Powering your productivity
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                        A unified full-stack knowledge platform built for modern discovery.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {allFeatures.map((f, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-4 p-6 bg-transparent border border-border/60 rounded-[24px] hover:border-accent/40 hover:shadow-sm transition-all duration-300 group"
                        >
                            <div className="shrink-0 p-2.5 rounded-xl bg-accent/5 text-accent border border-accent/10 group-hover:bg-accent/10 transition-colors">
                                <f.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <h3 className="font-matter font-semibold text-foreground text-lg leading-tight">
                                    {f.title}
                                </h3>
                                <p className="font-matter text-muted-foreground text-xs leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
