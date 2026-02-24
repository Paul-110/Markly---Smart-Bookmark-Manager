import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RadiantTextProps {
    children: ReactNode;
    className?: string;
    duration?: number;
}

export function RadiantText({
    children,
    className,
    duration = 3,
}: RadiantTextProps) {
    return (
        <div
            className={cn(
                "mx-auto max-w-fit animate-radiant bg-gradient-to-r from-transparent via-foreground/20 via-foreground/50 via-foreground/20 to-transparent bg-[length:200%_100%] bg-clip-text text-transparent transition-all duration-300",
                className
            )}
            style={
                {
                    "--duration": `${duration}s`,
                } as React.CSSProperties
            }
        >
            {children}
        </div>
    );
}
