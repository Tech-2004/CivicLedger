import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";

export const metadata: Metadata = {
  title: "CivicLedger",
  description: "Report civic issues. Track resolution. See accurate status.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
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
            <nav>
              <Link href="/report">Report</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/console">Console</Link>
              <Link href="/review">Review</Link>
            </nav>
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
