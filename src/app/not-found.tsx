import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
            <Bookmark className="h-16 w-16 text-accent mb-6 opacity-50" />
            <h1 className="text-6xl font-serif mb-4">404</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Oops! This page doesn&apos;t exist. The bookmark you&apos;re looking for might have been
                moved or deleted.
            </p>
            <Link href="/">
                <Button className="rounded-full bg-accent hover:bg-accent/90">
                    Back to Home
                </Button>
            </Link>
        </div>
    );
}
