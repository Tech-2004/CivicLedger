"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const COLLAPSE_KEY = "civicledger:sidebar-collapsed";

export interface ChromeProps {
  isSignedIn: boolean;
  isOperator: boolean;
  canReview: boolean;
  email: string | null;
  role: string | null;
}

/**
 * Owns the chrome and the sidebar's open/collapsed state, which the top bar's
 * triggers and the sidebar itself both need to read and write. Keeping it in one
 * client component avoids threading a context through the server layout.
 *
 * The sidebar is suppressed on the landing and sign-in pages: those are entry
 * points where the navigation targets all sit behind the sign-in the visitor
 * hasn't completed, so the chrome stays deliberately bare.
 */
export function ShellChrome({
  children,
  ...session
}: ChromeProps & { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore the preference after mount; reading localStorage during render would
  // desync the server and client HTML.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  // Close the drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const showSidebar = pathname !== "/" && pathname !== "/console/sign-in";

  return (
    // Sidebar first, spanning the full height; the top bar and page sit beside
    // it, so there is one straight vertical edge rather than an L-shaped seam.
    <div className="flex min-h-screen">
      {showSidebar && (
        <Sidebar
          {...session}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapsed={toggleCollapsed}
          onCloseMobile={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          {...session}
          showSidebarTrigger={showSidebar}
          showBrand={!showSidebar}
          onOpenSidebar={() => setMobileOpen(true)}
        />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
