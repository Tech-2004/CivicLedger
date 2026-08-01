import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";
import { SiteNav } from "@/components/SiteNav";

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
        <header className="site">
          <div className="inner">
            <Link href="/" style={{ fontWeight: 700, color: "var(--text)" }}>
              CivicLedger
            </Link>
            <SiteNav />
          </div>
        </header>
        <main className="container">{children}</main>
        <ServiceWorkerRegister />
        {/* Vercel-native observability (no-ops off Vercel / in dev) */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
