import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
    title: "Markly - Smart Bookmark Manager",
    description:
        "AI-powered bookmark manager with real-time collaboration, smart categorization, and analytics.",
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/bookmark-favicon.svg", type: "image/svg+xml" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        ],
        apple: "/icon-512.png",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="font-sans bg-ambient-site min-h-screen">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    {children}
                    <Toaster richColors position="bottom-right" />
                    <RegisterSW />
                </ThemeProvider>
            </body>
        </html>
    );
}
