"use client";

import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Copy, Trash2, Globe, Lock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { inviteMember, updateMemberRoleByUserId, removeMember, updateCollectionVisibility } from "@/app/actions/collection-actions";
import type { Collection, CollectionMember } from "@/types/bookmark";

export function ShareCollectionDialog({
    collection, open, onOpenChange, onSuccess,
}: {
    collection: Collection | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess?: () => void;
}) {
    const [email, setEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");
    const [isInviting, setIsInviting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    if (!collection) return null;

    const handleInvite = async () => {
        if (!email.trim()) return;
        setIsInviting(true);
        try {
            await inviteMember(collection.id, email, inviteRole);
            toast.success(`Invited ${email}`);
            setEmail("");
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to invite user");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateMemberRoleByUserId(collection.id, userId, newRole);
            toast.success("Role updated");
            onSuccess?.();
        } catch (error: any) {
            toast.error("Failed to update role");
        }
    };

    const handleRemove = async (userId: string) => {
        try {
            await removeMember(collection.id, userId);
            toast.success("Member removed");
            onSuccess?.();
        } catch (error: any) {
            toast.error("Failed to remove member");
        }
    };

    const handleVisibilityChange = async (isPublic: boolean) => {
        setIsUpdating(true);
        try {
            await updateCollectionVisibility(collection.id, isPublic);
            toast.success(isPublic ? "Collection is now public" : "Collection is now private");
            onSuccess?.();
        } catch (error: any) {
            toast.error("Failed to update visibility");
            // Revert switch visually if needed, but props will update from parent revalidation
        } finally {
            setIsUpdating(false);
        }
    };

    const copyLink = () => {
        const link = `${window.location.origin}/share/${collection.id}`;
        navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Share &ldquo;{collection.name}&rdquo;</DialogTitle>
                    <DialogDescription>
                        Manage access and visibility for this collection.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Public Access Toggle */}
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                {collection.is_public ? <Globe className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                                <Label className="text-base">Public Access</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {collection.is_public
                                    ? "Anyone with the link can view this collection."
                                    : "Only invited members can access this collection."}
                            </p>
                        </div>
                        <Switch
                            checked={collection.is_public}
                            onCheckedChange={handleVisibilityChange}
                            disabled={isUpdating}
                        />
                    </div>

                    {/* Copy Link (only if public) */}
                    {collection.is_public && (
                        <div className="flex items-center space-x-2">
                            <Input
                                id="share-link"
                                name="share-link"
                                readOnly
                                value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${collection.id}`}
                                className="flex-1 bg-muted text-xs h-8"
                                aria-label="Shareable link"
                            />
                            <Button size="sm" variant="outline" onClick={copyLink} className="h-8">
                                <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Invite People</h4>
                        <div className="flex gap-2">
                            <Input
                                id="invite-email"
                                name="invite-email"
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1"
                                autoComplete="email"
                                aria-label="Invite email address"
                            />
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleInvite} disabled={isInviting || !email}>
                                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Members</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {collection.members?.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback>{member.email.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{member.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {member.role === "owner" ? (
                                            <span className="text-xs text-muted-foreground px-2">Owner</span>
                                        ) : (
                                            <>
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(val) => handleRoleChange(member.id, val)}
                                                >
                                                    <SelectTrigger className="h-7 w-[85px] text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                        <SelectItem value="editor">Editor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemove(member.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
