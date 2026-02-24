"use client";

import React from "react";
import {
    User, Moon, Sun, Monitor, Sparkles,
    Shield, Bell, Database, LogOut, ChevronRight,
    Github, Mail, Globe, Check, Copy, ExternalLink, ShieldCheck
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface SettingsViewProps {
    user: any;
    session?: any;
    onSignOut: () => void;
    onUpdateMetadata: (metadata: any) => Promise<any>;
}

export function SettingsView({ user, session, onSignOut, onUpdateMetadata }: SettingsViewProps) {
    const { theme, setTheme } = useTheme();
    const [copied, setCopied] = React.useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);

    // Local state for settings
    const [username, setUsername] = React.useState(user?.user_metadata?.username || "");
    const [aiSettings, setAiSettings] = React.useState({
        provider: user?.user_metadata?.ai_provider || "openai",
        autoTagging: user?.user_metadata?.ai_auto_tagging ?? true,
        summaries: user?.user_metadata?.ai_summaries ?? true
    });

    const handleCopyToken = () => {
        if (session?.access_token) {
            navigator.clipboard.writeText(session.access_token);
            setCopied(true);
            toast.success("Session token copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            await onUpdateMetadata({ username });
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleAIConfigChange = async (key: string, value: any) => {
        const newSettings = { ...aiSettings, [key]: value };
        setAiSettings(newSettings);

        try {
            await onUpdateMetadata({
                ai_provider: newSettings.provider,
                ai_auto_tagging: newSettings.autoTagging,
                ai_summaries: newSettings.summaries
            });
            // Quiet success for "fastly" feel, maybe a small toast or just assume it worked
        } catch (error: any) {
            toast.error("Failed to sync AI settings");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-serif font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences and application configuration.</p>
            </div>

            {/* Profile Section */}
            <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg">Profile</CardTitle>
                    <CardDescription>Update your personal information and public profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <Avatar className="h-20 w-20 ring-4 ring-accent/10">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-xl font-bold">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" defaultValue={user?.email} disabled className="bg-muted/50 rounded-xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        placeholder="johndoe"
                                        className="rounded-xl"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="rounded-full px-6 bg-accent hover:bg-accent/90"
                                onClick={handleUpdateProfile}
                                disabled={isUpdatingProfile}
                            >
                                {isUpdatingProfile ? "Updating..." : "Update Profile"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appearance Section */}
            <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Appearance</CardTitle>
                    <CardDescription>Customize how Markly looks on your device.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={() => setTheme("light")}
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === "light" ? "border-accent bg-accent/5" : "border-border/40 hover:border-border"}`}
                        >
                            <div className="w-full aspect-video bg-white rounded-lg border flex items-center justify-center">
                                <Sun className="h-6 w-6 text-orange-500" />
                            </div>
                            <span className="text-sm font-medium">Light</span>
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === "dark" ? "border-accent bg-accent/5" : "border-border/40 hover:border-border"}`}
                        >
                            <div className="w-full aspect-video bg-[#0c0c0c] rounded-lg border border-white/10 flex items-center justify-center">
                                <Moon className="h-6 w-6 text-blue-500" />
                            </div>
                            <span className="text-sm font-medium">Dark</span>
                        </button>
                        <button
                            onClick={() => setTheme("system")}
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === "system" ? "border-accent bg-accent/5" : "border-border/40 hover:border-border"}`}
                        >
                            <div className="w-full aspect-video bg-gradient-to-br from-white to-[#0c0c0c] rounded-lg border flex items-center justify-center overflow-hidden">
                                <Monitor className="h-6 w-6 text-foreground" />
                            </div>
                            <span className="text-sm font-medium">System</span>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* AI Configuration Section */}
            <Card className="border-accent/20 bg-accent/5">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-accent text-white border-0">
                            <Sparkles className="h-3 w-3 mr-1" /> PREMIUM
                        </Badge>
                    </div>
                    <CardTitle className="text-lg">AI Configuration</CardTitle>
                    <CardDescription>Tailor the AI models for categorization and summaries.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Preferred AI Provider</Label>
                            <p className="text-sm text-muted-foreground">Select the engine for AI insights.</p>
                        </div>
                        <Select
                            value={aiSettings.provider}
                            onValueChange={(val) => handleAIConfigChange("provider", val)}
                        >
                            <SelectTrigger className="w-[180px] rounded-xl border-accent/20 h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                                <SelectItem value="gemini">Google Gemini 2.0</SelectItem>
                                <SelectItem value="deepseek">DeepSeek R1 / V3</SelectItem>
                                <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="bg-accent/10" />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Auto-tagging</Label>
                            <p className="text-sm text-muted-foreground">Automatically suggest tags for new bookmarks.</p>
                        </div>
                        <Switch
                            checked={aiSettings.autoTagging}
                            onCheckedChange={(val) => handleAIConfigChange("autoTagging", val)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Generate Summaries</Label>
                            <p className="text-sm text-muted-foreground">Create AI summaries for every saved link.</p>
                        </div>
                        <Switch
                            checked={aiSettings.summaries}
                            onCheckedChange={(val) => handleAIConfigChange("summaries", val)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Browser Extension Section */}
            <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                        Browser Extension
                    </CardTitle>
                    <CardDescription>Setup and manage your Markly Chrome Extension connection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">Manual Connection Token</p>
                                <p className="text-xs text-muted-foreground">If the extension fails to sync, use this token.</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full gap-2 px-4 border-accent/20 hover:bg-accent/5 font-semibold"
                                onClick={handleCopyToken}
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? "Copied" : "Copy Token"}
                            </Button>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 w-full rounded-xl bg-muted/10 pointer-events-none group-hover:bg-transparent transition-colors" />
                            <Input
                                value={session?.access_token || "Loading session token..."}
                                readOnly
                                className="font-mono text-xs bg-muted/20 border-border/20 pr-10 blur-[2px] hover:blur-none focus:blur-none transition-all cursor-default select-none group-hover:select-text"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-hover:hidden">
                                <Shield className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-dashed border-border/60 space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Instructions</p>
                            <ol className="text-xs space-y-2 text-muted-foreground list-decimal ml-4">
                                <li>Open the Markly Extension in Chrome</li>
                                <li>Go to the **Settings** view in the extension</li>
                                <li>Ensure the Dashboard URL is correct</li>
                                <li>Paste the token copied above into **Session Token**</li>
                                <li>Click **Connect Account**</li>
                            </ol>
                        </div>
                        <div className="flex flex-col justify-center gap-3 p-4">
                            <Button variant="link" className="h-auto p-0 justify-start text-xs text-blue-500 gap-1.5" asChild>
                                <a href="https://chrome.google.com/webstore" target="_blank" rel="noreferrer">
                                    <Globe className="h-3 w-3" /> Visit Chrome Web Store
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </Button>
                            <Button variant="link" className="h-auto p-0 justify-start text-xs text-muted-foreground gap-1.5">
                                <Shield className="h-3 w-3" /> Security and Privacy in Extension
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account & Safety */}
            <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Account & Security</CardTitle>
                    <CardDescription>Manage your authentication and data privacy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-between h-12 rounded-2xl group border-border/40 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span>Change Password</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between h-12 rounded-2xl group border-border/40 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            <Database className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span>Export All Data (.json)</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
                    </Button>
                    <Separator />
                    <Button
                        onClick={onSignOut}
                        variant="ghost"
                        className="w-full justify-start h-12 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive group"
                    >
                        <LogOut className="h-4 w-4 mr-3 group-hover:translate-x-1 transition-transform" />
                        Sign Out
                    </Button>
                </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-6 py-6 text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors"><Github className="h-5 w-5" /></a>
                <a href="#" className="hover:text-foreground transition-colors"><Globe className="h-5 w-5" /></a>
                <a href="#" className="hover:text-foreground transition-colors text-xs font-semibold tracking-widest uppercase">Privacy Policy</a>
                <a href="#" className="hover:text-foreground transition-colors text-xs font-semibold tracking-widest uppercase">Terms</a>
            </div>
        </div>
    );
}
