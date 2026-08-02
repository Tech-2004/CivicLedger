"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Building2, LogIn, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChromeProps } from "./ShellChrome";

/**
 * Top bar: brand and session controls only.
 *
 * Navigation lives in the collapsible sidebar, so this stays a thin strip rather
 * than duplicating the same destinations in two places.
 */
export function TopBar({
  isSignedIn,
  email,
  role,
  showSidebarTrigger,
  onOpenSidebar,
}: Pick<ChromeProps, "isSignedIn" | "email" | "role"> & {
  showSidebarTrigger: boolean;
  onOpenSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4">
        {/* Opens the drawer on small screens, where the sidebar is off-canvas. */}
        {showSidebarTrigger && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            onClick={onOpenSidebar}
            className="md:hidden"
          >
            <PanelLeft />
          </Button>
        )}

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold"
        >
          <Building2 className="size-5" />
          <span>CivicLedger</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isSignedIn ? (
            <>
              {email && (
                <span className="hidden max-w-[200px] truncate text-xs text-muted-foreground sm:inline">
                  {email}
                  {role && (
                    <span className="ml-1.5 font-bold uppercase tracking-wide">
                      {role}
                    </span>
                  )}
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <Link
              href="/console/sign-in"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              <LogIn className="size-4" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
