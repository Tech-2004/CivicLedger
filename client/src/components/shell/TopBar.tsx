"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogIn, LogOut, PanelLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./Logo";
import type { ChromeProps } from "./ShellChrome";

/**
 * Top bar: session controls, and the drawer trigger on small screens.
 *
 * The brand lives in the sidebar, which spans the full height, so this bar starts
 * to its right. On pages without a sidebar (landing, sign-in) the brand is shown
 * here instead, otherwise it would disappear entirely.
 *
 * Identity moved into a dropdown: an email and a role chip sitting loose in the
 * bar crowded it and truncated badly on narrow screens, and the account menu is
 * where people look for sign-out anyway.
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
  const initial = (email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4">
        {showSidebarTrigger && (
          <Button
            variant="ghost"
            size="icon-sm"
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
              ? "flex shrink-0 items-center"
              : "flex shrink-0 items-center md:hidden"
          }
        >
          <Logo />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="grid size-8 cursor-pointer place-items-center rounded-full border border-border bg-secondary text-xs font-semibold transition-colors hover:border-border-strong hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {email}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider">
                    {role ?? "resident"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  // `redirectTo`, not `callbackUrl`: the latter is deprecated in
                  // Auth.js v5 and ignored, so sign-out fell back to reloading
                  // the current page - which middleware bounced to sign-in.
                  onSelect={() => void signOut({ redirectTo: "/" })}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/console/sign-in"
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "gap-1.5",
              })}
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
