"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Bookmark, Sparkles, Search, Share2, BarChart3, FolderOpen,
    ArrowRight, ChevronRight, Menu, X, Moon, Sun, Link as LinkIcon, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy-load below-fold section to reduce initial bundle
const WhyMarklySection = dynamic(() => import("@/components/WhyMarklySection").then(m => m.WhyMarklySection), { ssr: false });

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const easeCTA: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Theme Toggle ────────────────────────────────────────────
function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className="w-9 h-9" />;
    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
        >
            {theme === "dark" ?
                <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100" /> :
                <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100" />
            }
        </button>
    );
}

// ─── Page Loader ─────────────────────────────────────────────
function PageLoader({ onComplete }: { onComplete: () => void }) {
    useEffect(() => {
        // Reduced timeout to make the initial load feel faster.
        const timer = setTimeout(onComplete, 700);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
            exit={{ opacity: 0, transition: { duration: 0.3, ease } }}
        >
            <div className="flex flex-col items-center gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.0, duration: 0.3, ease }}
                    className="flex justify-center mb-2"
                >
                    <Bookmark className="w-12 h-12 text-accent" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, ease }}
                    className="text-4xl md:text-5xl font-serif tracking-tight"
                >
                    Markly
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4, ease }}
                    className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                    Save smarter, find faster
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.3, ease }}
                    className="w-12 h-[1.5px] bg-gradient-to-r from-[hsl(24,90%,55%)] to-[hsl(220,80%,55%)]"
                />
            </div>
        </motion.div>
    );
}

// ─── Navbar ──────────────────────────────────────────────────
const navLinks = [
    { label: "FEATURES", href: "#features" },
    { label: "HOW IT WORKS", href: "#how-it-works" },
    { label: "PLATFORMS", href: "#deployment" },
];

function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    // Mapped "glossy" styles from user snippet:
    // bg-sf/25 -> bg-background/25
    // backdrop-blur-[75px] -> backdrop-blur-[75px]
    // border-tx/8 -> border-foreground/10
    // rounded-4xl -> rounded-[32px]
    const glossyContainerClass = "bg-background/25 backdrop-blur-[75px] border border-foreground/10 rounded-[32px] p-1";

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4">
            <div className="max-w-6xl mx-auto">
                {/* Desktop & Mobile Main Bar */}
                <div className={`${glossyContainerClass} flex items-center justify-between pl-5 pr-2 py-2 shadow-sm transition-all duration-300`}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-accent" />
                        <span className="text-xl font-serif tracking-tight">Markly</span>
                    </Link>

                    {/* Desktop nav links (Hidden on mobile - mapped to lg) */}
                    <div className="hidden lg:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="group flex items-center gap-1 text-[11px] font-semibold tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                                <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                            </a>
                        ))}
                    </div>

                    {/* Desktop actions (Hidden on mobile) */}
                    <div className="hidden lg:flex items-center gap-2">
                        <ThemeToggle />
                        <Link href="/auth">
                            <Button variant="default" className="rounded-full px-5 text-xs hover:scale-[1.03] active:scale-[0.97] transition-transform">
                                Experience Markly
                            </Button>
                        </Link>
                        <Link href="/auth">
                            <Button variant="outline" className="rounded-full px-5 text-xs hover:scale-[1.03] active:scale-[0.97] transition-transform">
                                Sign in
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile actions (Hamburger - derived from user snippet) */}
                    <div className="flex lg:hidden items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="flex flex-col justify-center items-center space-y-1 focus:outline-none w-8 h-8 mr-1"
                        >
                            <span
                                className={`w-6 h-0.5 bg-foreground transition-transform duration-300 ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`}
                            />
                            <span
                                className={`w-6 h-0.5 bg-foreground transition-opacity duration-300 ${mobileOpen ? "opacity-0" : ""}`}
                            />
                            <span
                                className={`w-6 h-0.5 bg-foreground transition-transform duration-300 ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.2, ease }}
                            className={`lg:hidden mt-2 ${glossyContainerClass} p-4 shadow-lg`}
                        >
                            <div className="space-y-1 mb-3">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="block px-4 py-2.5 rounded-2xl text-xs font-semibold tracking-[0.12em] text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                            <div className="border-t border-border/40 pt-3 space-y-2">
                                <Link href="/auth" className="block" onClick={() => setMobileOpen(false)}>
                                    <Button className="w-full rounded-full text-xs">Experience Markly</Button>
                                </Link>
                                <Link href="/auth" className="block" onClick={() => setMobileOpen(false)}>
                                    <Button variant="outline" className="w-full rounded-full text-xs">Sign in</Button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}

// ─── Section Header (viewport-triggered animation) ──────────
function SectionHeader({ badge, title, subtitle, accent }: {
    badge: string; title: string; subtitle: string; accent?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-14"
        >
            <span className="inline-block text-[10px] font-semibold tracking-[0.2em] uppercase text-accent border border-accent/20 rounded-full px-4 py-1.5 mb-4">
                {badge}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif mb-3">
                {title}{" "}{accent && <span className="text-accent">{accent}</span>}
            </h2>
            <p className="text-sm text-foreground/80 max-w-xl mx-auto">{subtitle}</p>
        </motion.div>
    );
}

// ─── Features / Steps Data ───────────────────────────────────
const features = [
    { icon: Bookmark, title: "Smart Bookmarking", desc: "Save any link with one click. Auto-fetch titles, favicons, and metadata instantly." },
    { icon: Sparkles, title: "AI Categorization", desc: "Let AI analyze and categorize your bookmarks with smart tags and folders." },
    { icon: Search, title: "Instant Search", desc: "Find any bookmark in milliseconds. Search across titles, tags, URLs, and content." },
    { icon: Share2, title: "Shared Collections", desc: "Collaborate on bookmark collections with your team. Real-time sync built in." },
    { icon: BarChart3, title: "Click Analytics", desc: "Track which bookmarks you visit most. Beautiful charts and usage insights." },
    { icon: FolderOpen, title: "Smart Folders", desc: "Organize with nested collections, drag-and-drop, and custom sorting." },
];

const steps = [
    { icon: LinkIcon, step: "01", title: "Paste any URL", desc: "Just paste a link and Markly fetches all the metadata automatically." },
    { icon: Sparkles, step: "02", title: "AI does the rest", desc: "Smart categorization, tagging, and summaries powered by AI." },
    { icon: Globe, step: "03", title: "Access anywhere", desc: "Your bookmarks sync across all devices. Always available, always organized." },
];

// ─── Deployment Section (sarvam.ai "Built to run anywhere") ──
function DeploymentSection() {
    const options = [
        { title: "Markly Cloud", desc: "Fully managed, fastest time-to-value.", href: "/auth", btnText: "Get Started" },
        { title: "Browser Extension", desc: "Save from any page with one click.", href: "#", btnText: "Install Now" },
        { title: "PWA / Mobile", desc: "Install on any device, access offline.", href: "#how-it-works", btnText: "Learn More" },
    ];
    return (
        <section id="deployment" className="py-16 px-6 bg-transparent">
            <div className="relative z-10 max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease }}
                    className="text-center mb-12"
                >
                    <h2 className="text-2xl md:text-3xl font-serif mb-3">
                        Built to run <span className="text-accent">anywhere you browse</span>
                    </h2>
                </motion.div>
                <div className="grid md:grid-cols-3 gap-5">
                    {options.map((o, i) => (
                        <motion.div
                            key={o.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5, ease }}
                            className="rounded-2xl border border-border p-6 bg-transparent text-center flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="text-sm font-sans font-semibold mb-1">{o.title}</h3>
                                <p className="text-xs text-muted-foreground mb-4">{o.desc}</p>
                            </div>
                            <Link href={o.href}>
                                <Button variant="outline" size="sm" className="w-full rounded-full text-[10px] font-semibold tracking-wider h-8">
                                    {o.btnText}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Landing Page ────────────────────────────────────────────
export default function LandingPage() {
    return (
        <>
            <div className="relative min-h-screen overflow-hidden">
                {/* Navbar */}
                <Navbar />

                {/* Hero Section (Ambient CSS Background) */}
                <section className="relative flex flex-col pt-28 md:pt-40 min-h-screen overflow-visible bg-transparent min-w-full">

                    <div className="flex flex-1 justify-center items-center mx-auto pb-[12vh] w-[85%] md:w-9/12 max-w-6xl overflow-visible">
                        <div className="relative flex flex-col items-center w-full">

                            <div className="z-10 relative flex flex-col items-center gap-5 md:gap-10">
                                {/* Motif */}
                                <div className="relative w-auto h-auto px-4 md:px-0">
                                    <Image
                                        src="/assets/svg/motif.svg"
                                        alt=""
                                        width={450}
                                        height={70}
                                        style={{ width: "auto", height: "auto" }}
                                        className="object-contain dark:invert-0 invert transition-all duration-700 opacity-90 hover:opacity-100 max-w-full"
                                        priority
                                    />
                                </div>

                                {/* Badge */}
                                <div
                                    data-animate="badge"
                                    className="relative bg-sf/50 shadow-[0px_0px_60px_0px_rgba(85,106,220,0.12)] backdrop-blur-lg px-5 py-2.5 border border-sr-indigo-200/60 rounded-full overflow-hidden"
                                    style={{ translate: "none", rotate: "none", scale: "none", transform: "translate(0px, 0px)", opacity: 1 }}
                                >
                                    <span
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-shimmer pointer-events-none"
                                        aria-hidden="true"
                                    />
                                    <p className="relative font-matter font-semibold text-sr-indigo-800 text-sm text-center leading-normal tracking-wide">
                                        AI-Powered Bookmark Manager
                                    </p>
                                </div>

                                {/* Headings */}
                                <div className="flex flex-col items-center gap-2.5 md:gap-3">
                                    <h1
                                        data-animate="heading"
                                        className="relative z-10 font-season-mix font-bold text-4xl md:text-6xl lg:text-7xl text-center leading-[1.2] tracking-tight text-foreground"
                                        style={{ translate: "none", rotate: "none", scale: "none", transform: "translate(0px, 0px)", opacity: 1 }}
                                    >
                                        Save smarter, <span className="text-accent">find faster</span>
                                    </h1>
                                    <p
                                        data-animate="subheading"
                                        className="max-w-[800px] font-matter text-foreground/80 md:text-[22px] text-lg text-center leading-[1.6]"
                                        style={{ translate: "none", rotate: "none", scale: "none", transform: "translate(0px, 0px)", opacity: 1 }}
                                    >
                                        Stop losing important links. Markly uses AI to categorize, summarize,<br className="hidden md:block" />
                                        and organize your bookmarks — with real-time collaboration.
                                    </p>
                                </div>

                                {/* CTA */}
                                <div data-animate="cta" style={{ translate: "none", rotate: "none", scale: "none", transform: "translate(0px, 0px)", opacity: 1 }}>
                                    <Link href="/auth" aria-label="Get Started Free">
                                        <button className="relative inline-flex items-center justify-center cursor-pointer font-season-mix font-medium transition-all duration-500 overflow-hidden rounded-full hover:duration-700 active:scale-95 active:duration-200 touch-manipulation px-6 py-3.5 text-lg bg-[#131313] text-white shadow-[inset_0_0_12px_rgba(255,255,255,1),0px_0px_2px_0_rgba(0,0,0,0.1)] group">
                                            <span
                                                className="absolute inset-0 opacity-0 transition-opacity duration-700 bg-[linear-gradient(90deg,#131313_0%,#0A2156_33%,#BED2FF_66%,#FF8717_100%)] group-hover:opacity-100 group-active:opacity-100 rounded-full shadow-[inset_0px_0px_12px_2px_rgba(255,255,255,0.5)]"
                                                style={{ backgroundPosition: "var(--x, 50%) 0%", backgroundSize: "200% 100%" }}
                                                aria-hidden="true"
                                            />
                                            <span className="z-10 relative flex items-center gap-2 transition-all duration-500">
                                                Get Started Free
                                            </span>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section (Why Markly) */}
                <WhyMarklySection />

                {/* Detailed Features Section */}
                <section id="features" className="relative py-20 px-6 bg-transparent">
                    <div className="relative z-10 max-w-6xl mx-auto">
                        <SectionHeader
                            badge="FEATURES"
                            title="Everything you need to"
                            accent="manage bookmarks"
                            subtitle="Powerful features to help you save, organize, and rediscover your bookmarks."
                        />
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {features.map((f, i) => (
                                <motion.div
                                    key={f.title}
                                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: i * 0.08, duration: 0.5, ease }}
                                    className="rounded-2xl p-7 border border-border bg-transparent hover:border-accent/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                                        <f.icon className="w-5 h-5 text-accent" />
                                    </div>
                                    <h3 className="text-base font-sans font-semibold mb-2">{f.title}</h3>
                                    <p className="text-xs text-foreground/70 leading-relaxed">{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="relative py-20 px-6 bg-transparent">
                    <div className="relative z-10 max-w-6xl mx-auto">
                        <SectionHeader
                            badge="HOW IT WORKS"
                            title="Three steps to"
                            accent="organized bliss"
                            subtitle="Getting started with Markly takes less than a minute."
                        />
                        <div className="grid md:grid-cols-3 gap-10 text-center">
                            {steps.map((s, i) => (
                                <motion.div
                                    key={s.step}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: i * 0.1, duration: 0.5, ease }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                                        <s.icon className="w-6 h-6 text-accent" />
                                    </div>
                                    <span className="text-[10px] font-mono text-accent font-bold tracking-[0.2em] mb-2">{s.step}</span>
                                    <h3 className="text-lg font-serif mb-2">{s.title}</h3>
                                    <p className="text-xs text-foreground/70 max-w-xs">{s.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Deployment Section */}
                <DeploymentSection />

                {/* CTA Section */}
                <section id="cta" className="relative py-20 px-6 bg-transparent">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: easeCTA }}
                        className="relative z-10 max-w-3xl mx-auto text-center"
                    >
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif mb-4">
                            Build the future of bookmarking with{" "}
                            <span className="text-accent">Markly.</span>
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8">
                            Join thousands of users who trust Markly to manage their bookmarks intelligently.
                        </p>
                        <Link href="/auth">
                            <Button className="rounded-full px-7 gap-2 hover:scale-[1.03] active:scale-[0.97] transition-transform">
                                Start for Free <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </motion.div>
                </section>

                {/* Footer */}
                <footer className="py-12 px-6 relative z-10 bg-transparent mt-12">
                    <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-6 text-center">
                        <div className="flex items-center gap-2">
                            <Bookmark className="w-5 h-5 text-accent" />
                            <span className="font-serif text-xl">Markly</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-8">
                            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
                            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                            <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
                        </div>
                        <p className="text-xs text-muted-foreground opacity-60">
                            © {new Date().getFullYear()} Markly. Refined for productivity.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
