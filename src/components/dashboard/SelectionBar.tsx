"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionBarProps {
    count: number;
    onClear: () => void;
    onDelete: () => void;
    onShare: () => void;
}

export function SelectionBar({ count, onClear, onDelete, onShare }: SelectionBarProps) {
    const hasSelection = count > 0;

    return (
        <AnimatePresence>
            {hasSelection && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto z-40"
                >
                    <div className="flex items-center gap-4 bg-background/80 backdrop-blur-lg border border-foreground/10 rounded-full p-2 shadow-2xl">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClear}
                                className="rounded-full"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold pr-2">
                                {count} item{count > 1 ? "s" : ""} selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onShare}
                                className="rounded-full gap-2"
                            >
                                <Share2 className="h-4 w-4" /> Share
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={onDelete}
                                className="rounded-full gap-2"
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
