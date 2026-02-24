"use client";

import { useEffect } from "react";

/**
 * RegisterSW component
 * 
 * In development, we unregister existing service workers to avoid caching issues.
 * In a real production app, you would register sw.js here.
 */
export function RegisterSW() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Check for development mode without using process.env directly if it's causing manifest issues
            const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

            if (isDev) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (const registration of registrations) {
                        registration.unregister();
                        console.log("Service Worker unregistered in dev mode");
                    }
                });
            } else {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("Service Worker registered:", registration.scope);
                    })
                    .catch((error) => {
                        console.error("Service Worker registration failed:", error);
                    });
            }
        }
    }, []);

    return null;
}
