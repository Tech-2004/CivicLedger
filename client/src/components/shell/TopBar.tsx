"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Building2, LogIn, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChromeProps } from "./ShellChrome";

/**
 * Top bar: session controls, and the drawer trigger on small screens.
 *
 * The brand lives in the sidebar, which spans the full height, so this bar starts
 * to its right. On pages without a sidebar (landing, sign-in) the brand is shown
 * here instead, otherwise it would disappear entirely.
 */
export function TopBar({
  isSignedIn,
  email,
  role,
  showSidebarTrigger,
  showBrand,
  onOpenSidebar,
}: Pick<ChromeProps, "isSignedIn" | "email" | "role"> & {
  showSidebarTrigger: boolean;
  showBrand: boolean;
  onOpenSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-border bg-card/95 backdrop-blur">
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

        {/* Shown when the sidebar is absent, or on mobile where it is off-canvas. */}
        <Link
          href="/"
          className={
            showBrand
              ? "flex shrink-0 items-center gap-2 font-semibold"
              : "flex shrink-0 items-center gap-2 font-semibold md:hidden"
          }
        >
          <Building2 className="size-5" />
          <span>CivicLedger</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isSignedIn ? (
            <>
              {email && (
                <span className="hidden max-w-[220px] truncate text-xs text-muted-foreground sm:inline">
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
                // `redirectTo`, not `callbackUrl`: the latter is deprecated in
                // Auth.js v5 and ignored, so sign-out fell back to reloading the
                // current page - which middleware then bounced to sign-in.
                onClick={() => void signOut({ redirectTo: "/" })}
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
