import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Database, BrainCircuit, Search, ArrowRight } from "lucide-react";

export function PlatformStack() {
    return (
        <section className="relative mx-auto w-[85%] md:w-9/12 max-w-[1400px] mb-24 md:mb-32">
            <div className="flex flex-col items-center gap-12 md:gap-16">

                {/* Header */}
                <div className="flex flex-col items-center text-center gap-6 w-full">
                    <p className="font-matter font-medium text-muted-foreground text-xs text-center uppercase tracking-[2px]">
                        For Individuals | Teams | Enterprise
                    </p>
                    <h2 className="font-season-mix md:font-normal font-normal w-full px-3 md:px-0 text-3xl md:text-[36px] text-foreground leading-[135%] whitespace-pre-line">
                        Full-stack Knowledge Platform
                    </h2>
                </div>

                {/* Stacking Cards Container */}
                <div className="w-full flexflex-col gap-8 relative">
                    {/* Card 1: Capture */}
                    <div className="sticky top-24 md:top-32 z-10">
                        <div className="flex md:flex-row flex-col items-stretch w-full bg-background/80 backdrop-blur-xl border border-border/50 rounded-[48px] overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
                            {/* Graphic Left */}
                            <div className="relative w-full md:w-1/2 h-[320px] md:h-[480px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 overflow-hidden flex items-center justify-center p-10">
                                <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
                                <div className="relative w-full h-full border border-border/40 bg-white/40 backdrop-blur-md rounded-3xl shadow-lg flex items-center justify-center">
                                    <Database className="w-20 h-20 text-foreground/20" />
                                    {/* Mock UI Element */}
                                    <div className="absolute bottom-6 left-6 right-6 h-12 bg-white rounded-lg shadow-sm border border-border/20 flex items-center px-4 gap-3">
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                        <div className="h-2 w-20 bg-gray-100 rounded-full" />
                                    </div>
                                </div>
                            </div>
                            {/* Content Right */}
                            <div className="relative w-full md:w-1/2 flex flex-col justify-center px-6 md:px-20 py-8 md:py-16 gap-6">
                                <div className="flex flex-col gap-3 md:gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-matter font-medium text-foreground md:text-[26px] text-xl leading-tight tracking-[-0.26px]">
                                            Capture Everything
                                        </h3>
                                    </div>
                                    <p className="font-matter text-muted-foreground md:text-[18px] text-base leading-[1.55] tracking-[-0.18px]">
                                        Save articles, videos, and threads with a single click. Markly parses content instantly, removing clutter and preserving what matters.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    {["Web Clipper", "API", "Integrations"].map(tag => (
                                        <span key={tag} className="inline-flex items-center bg-secondary/50 px-3 py-1.5 border border-border rounded-full font-matter text-muted-foreground text-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Organize */}
                    <div className="sticky top-28 md:top-36 z-20">
                        <div className="flex md:flex-row flex-col items-stretch w-full bg-background/90 backdrop-blur-xl border border-border/50 rounded-[48px] overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
                            {/* Graphic Left */}
                            <div className="relative w-full md:w-1/2 h-[320px] md:h-[480px] bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden flex items-center justify-center p-10">
                                <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
                                <div className="relative w-full h-3/4 border border-border/40 bg-white/40 backdrop-blur-md rounded-3xl shadow-lg flex flex-col p-6 gap-4">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                        <BrainCircuit className="w-6 h-6 text-amber-500/60" />
                                        <div className="h-2 w-24 bg-amber-500/10 rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-10 w-full bg-white/50 rounded-lg border border-border/10" />
                                        <div className="h-10 w-full bg-white/50 rounded-lg border border-border/10" />
                                        <div className="h-10 w-full bg-white/50 rounded-lg border border-border/10" />
                                    </div>
                                </div>
                            </div>
                            {/* Content Right */}
                            <div className="relative w-full md:w-1/2 flex flex-col justify-center px-6 md:px-20 py-8 md:py-16 gap-6">
                                <div className="flex flex-col gap-3 md:gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                                            <BrainCircuit className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-matter font-medium text-foreground md:text-[26px] text-xl leading-tight tracking-[-0.26px]">
                                            AI-Powered Organization
                                        </h3>
                                    </div>
                                    <p className="font-matter text-muted-foreground md:text-[18px] text-base leading-[1.55] tracking-[-0.18px]">
                                        Forget manual tagging. Markly's AI models analyze your content to auto-tag, categorize, and even summarize key insights for quick consumption.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    {["Auto-tagging", "Summaries", "Relationships"].map(tag => (
                                        <span key={tag} className="inline-flex items-center bg-secondary/50 px-3 py-1.5 border border-border rounded-full font-matter text-muted-foreground text-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Retrieve */}
                    <div className="sticky top-32 md:top-40 z-30">
                        <div className="flex md:flex-row flex-col items-stretch w-full bg-background backdrop-blur-xl border border-border/50 rounded-[48px] overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
                            {/* Graphic Left */}
                            <div className="relative w-full md:w-1/2 h-[320px] md:h-[480px] bg-gradient-to-br from-green-500/5 to-emerald-500/5 overflow-hidden flex items-center justify-center p-10">
                                <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
                                <div className="relative w-3/4 aspect-square rounded-full border border-green-500/20 bg-green-500/5 flex items-center justify-center">
                                    <Search className="w-16 h-16 text-green-600/40" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full animate-[spin_10s_linear_infinite] opacity-30">
                                        <div className="w-3 h-3 rounded-full bg-green-500 absolute top-0 left-1/2" />
                                    </div>
                                </div>
                            </div>
                            {/* Content Right */}
                            <div className="relative w-full md:w-1/2 flex flex-col justify-center px-6 md:px-20 py-8 md:py-16 gap-6">
                                <div className="flex flex-col gap-3 md:gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                                            <Search className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-matter font-medium text-foreground md:text-[26px] text-xl leading-tight tracking-[-0.26px]">
                                            Instant Retrieval
                                        </h3>
                                    </div>
                                    <p className="font-matter text-muted-foreground md:text-[18px] text-base leading-[1.55] tracking-[-0.18px]">
                                        Find exactly what you need with semantic search. Ask questions about your library and get answers based on your saved knowledge.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    {["Semantic Search", "Q&A", "Chat"].map(tag => (
                                        <span key={tag} className="inline-flex items-center bg-secondary/50 px-3 py-1.5 border border-border rounded-full font-matter text-muted-foreground text-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
