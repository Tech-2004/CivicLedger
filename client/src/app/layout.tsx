import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "CivicLedger",
  description: "Report civic issues. Track resolution. See accurate status.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  // Matches --bg in globals.css.
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* One frame for every route - see AppShell. */}
        <AppShell>{children}</AppShell>
        <ServiceWorkerRegister />
        {/* Vercel-native observability (no-ops off Vercel / in dev) */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
