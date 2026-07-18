"use client";

import { useEffect } from "react";

// Registers the offline-shell service worker (PRD 3.1 PWA offline drafts).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort */
      });
    }
  }, []);
  return null;
}
