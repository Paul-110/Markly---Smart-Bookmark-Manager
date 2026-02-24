import React from "react";
import {
    LayoutTemplate,
    Zap,
    Globe,
    Cpu,
    MessageSquare,
    BarChart,
    Shield,
    Smartphone
} from "lucide-react";

export function MarqueeStrip() {
    // Placeholder items since original SVGs are missing
    const logos = [
        { icon: LayoutTemplate, name: "Layouts" },
        { icon: Zap, name: "Fast" },
        { icon: Globe, name: "Global" },
        { icon: Cpu, name: "AI Core" },
        { icon: MessageSquare, name: "Chat" },
        { icon: BarChart, name: "Analytics" },
        { icon: Shield, name: "Secure" },
        { icon: Smartphone, name: "Mobile" },
    ];

    return (
        <div className="flex flex-col items-center gap-8 pb-8 md:pb-14 w-full shrink-0 mt-16 md:mt-24">
            <p className="font-matter font-semibold text-tx-tertiary text-xs uppercase tracking-[3px] text-center">
                Trusted by innovative teams
            </p>

            <div
                className="logo-carousel-container mx-auto w-full max-w-[100vw] overflow-hidden relative"
                role="region"
                aria-label="Partner logos carousel"
            >
                {/* Gradient Masks for fade effect */}
                <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-sf to-transparent" />
                <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-sf to-transparent" />

                <div
                    className="logo-carousel-track flex"
                    style={{
                        width: "100%",
                        position: "relative",
                        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)"
                    }}
                >
                    {/* Inner Track - Animated */}
                    <div className="flex items-center gap-8 md:gap-16 animate-marquee w-max py-4">
                        {/* Render logos twice for seamless loop */}
                        {[...logos, ...logos, ...logos].map((logo, index) => (
                            <div
                                key={index}
                                className="logo-item flex flex-col items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                                style={{ width: "120px", flexShrink: 0 }}
                            >
                                <logo.icon className="w-8 h-8 md:w-10 md:h-10 text-foreground" />
                                <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60">{logo.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
