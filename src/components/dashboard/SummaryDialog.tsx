"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Check } from "lucide-react";
import { Bookmark } from "@/types/bookmark";
import { summarizeBookmark } from "@/app/actions/ai-analyze";
import { toast } from "sonner";

interface SummaryDialogProps {
    bookmark: Bookmark | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SummaryDialog({ bookmark, open, onOpenChange }: SummaryDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [summary, setSummary] = useState<string>("");
    const [copied, setCopied] = useState(false);

    const handleRegenerate = () => {
        if (!bookmark) return;
        setSummary("");
        startTransition(async () => {
            try {
                const result = await summarizeBookmark(bookmark.id, true);
                if (result && typeof result === 'object' && result.summary) {
                    setSummary(result.summary);
                    toast.success("Summary regenerated");
                } else {
                    setSummary("Failed to generate summary content.");
                    toast.error("AI returned empty result");
                }
            } catch (error: any) {
                console.error("Regeneration error:", error);
                const isRateLimit = error.message?.includes("Rate Limit") || error.message?.includes("429");
                const msg = isRateLimit
                    ? "AI is currently busy. Please wait a moment before trying again."
                    : `Regeneration failed: ${error.message || "Unknown error"}`;

                toast.error(msg);
                setSummary(`Error: ${isRateLimit ? "Rate limit reached." : "AI processing failed."}`);
            }
        });
    };

    useEffect(() => {
        if (open && bookmark) {
            if (bookmark.ai_summary) {
                setSummary(bookmark.ai_summary);
            } else {
                setSummary("");
                startTransition(async () => {
                    try {
                        const result = await summarizeBookmark(bookmark.id);
                        if (result && typeof result === 'object' && result.summary) {
                            setSummary(result.summary);
                        } else {
                            setSummary("No summary could be generated for this bookmark.");
                        }
                    } catch (error: any) {
                        console.error("Initial summary error:", error);
                        setSummary(`Error: ${error.message || "Failed to generate summary"}`);
                    }
                });
            }
        }
    }, [open, bookmark, onOpenChange]);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Summary copied to clipboard");
    };

    if (!bookmark) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif">
                        <Sparkles className="h-5 w-5 text-accent" />
                        AI Summary
                    </DialogTitle>
                    <DialogDescription className="line-clamp-1">
                        {bookmark.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isPending ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-full"></div>
                            <div className="h-4 bg-muted rounded w-5/6"></div>
                            <p className="text-xs text-muted-foreground pt-2">Analyzing content...</p>
                        </div>
                    ) : (
                        <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed border border-border/50">
                            {summary || bookmark.ai_summary || "No summary available."}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-accent hover:text-accent/80 hover:bg-accent/5 gap-2"
                            onClick={handleRegenerate}
                            disabled={isPending}
                        >
                            <Sparkles className={`h-4 w-4 ${isPending ? "animate-pulse" : ""}`} />
                            Regenerate
                        </Button>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopy}
                        disabled={!summary || isPending}
                        className="gap-2"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy Summary"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
