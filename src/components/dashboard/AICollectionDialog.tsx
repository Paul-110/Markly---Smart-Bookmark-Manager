"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, FolderPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { suggestCollections } from "@/app/actions/ai-analyze";
import { createCollection, setCollectionBookmarks } from "@/lib/data/collections";

interface Suggestion {
    name: string;
    description: string;
    bookmark_ids: string[];
}

export function AICollectionDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch authenticated user
    useEffect(() => {
        createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    }, []);

    useEffect(() => {
        if (open && suggestions.length === 0 && !loading && !error) {
            setLoading(true);
            suggestCollections()
                .then((data) => {
                    if (data.length === 0) {
                        setError("Not enough bookmarks to formulate suggestions.");
                    } else {
                        setSuggestions(data);
                        // Auto-select all by default
                        setSelectedIndices(new Set(data.map((_: unknown, i: number) => i)));
                    }
                })
                .catch((err) => {
                    console.error(err);
                    setError("Failed to generate suggestions. Please try again.");
                })
                .finally(() => setLoading(false));
        }
    }, [open, suggestions.length, loading, error]);

    const handleCreate = async () => {
        if (!userId) { toast.error("Not authenticated"); return; }
        setProcessing(true);
        const toCreate = suggestions.filter((_, i) => selectedIndices.has(i));
        let createdCount = 0;

        for (const s of toCreate) {
            try {
                const newCol = await createCollection(userId!, s.name, s.description);
                if (newCol && newCol.id) {
                    await setCollectionBookmarks(newCol.id, s.bookmark_ids);
                    createdCount++;
                }
            } catch (e) {
                console.error("Failed to create collection:", s.name, e);
            }
        }

        toast.success(`Created ${createdCount} collection${createdCount !== 1 ? "s" : ""}`);
        setProcessing(false);
        onOpenChange(false);
        // Reset for next time? Or keep?
        // Better to reset if successful
        if (createdCount > 0) {
            setSuggestions([]);
            setError("");
        }
    };

    const toggleSelect = (index: number) => {
        const next = new Set(selectedIndices);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setSelectedIndices(next);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif">
                        <Sparkles className="h-5 w-5 text-accent" />
                        AI Smart Organization
                    </DialogTitle>
                    <DialogDescription>
                        We analyzed your bookmarks and found these potential collections.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-[300px] flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-accent" />
                            <p>Analyzing library...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <AlertCircle className="h-8 w-8 text-destructive/50" />
                            <p>{error}</p>
                            <Button variant="outline" size="sm" onClick={() => { setError(""); setSuggestions([]); }}>
                                Retry
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        className={`p-4 rounded-xl border transition-all ${selectedIndices.has(i)
                                            ? "border-accent bg-accent/5"
                                            : "border-border hover:border-accent/50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                checked={selectedIndices.has(i)}
                                                onCheckedChange={() => toggleSelect(i)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold">{s.name}</h3>
                                                    <Badge variant="outline" className="text-xs">
                                                        {s.bookmark_ids.length} bookmarks
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{s.description}</p>
                                                {/* Could show preview of bookmarks here if we had the titles, 
                                                    but we only have IDs from the server action unless we fetch them or pass them back.
                                                    The server action `suggestCollections` DOES create descriptions based on content.
                                                */}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <div className="flex items-center justify-between w-full">
                        <p className="text-xs text-muted-foreground">
                            {selectedIndices.size} selected
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={loading || processing || selectedIndices.size === 0 || !!error}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    <>
                                        <FolderPlus className="mr-2 h-4 w-4" /> Create Collections
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
