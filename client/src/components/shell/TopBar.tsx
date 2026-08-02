"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Building2, LogIn, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

/**
 * Top navigation bar.
 *
 * The left rail on the dashboard belongs to that page's own filters, so global
 * navigation lives up here rather than competing for the same column.
 *
 * Landing page: the header carries only sign-in. Report and the dashboard are
 * reached from the hero, and both sit behind sign-in anyway, so listing them
 * twice for a visitor who can't use them yet is just noise.
 *
 * Booleans rather than the operator object, so internal jurisdiction/department
 * ids are never serialised into the HTML. Presentation only - enforcement is
 * middleware, requireOperator, and RLS.
 */
export function TopBar({
  isSignedIn,
  isOperator,
  canReview,
  email,
}: {
  isSignedIn: boolean;
  isOperator: boolean;
  canReview: boolean;
  email: string | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Pages where the header stays minimal. The landing page already offers these
  // destinations in its hero, and on the sign-in page they're a dead end - both
  // sit behind the very sign-in the visitor is in the middle of.
  const isMinimal = pathname === "/" || pathname === "/console/sign-in";

  const items: NavItem[] = isMinimal
    ? []
    : [
        { href: "/report", label: "Report" },
        { href: "/dashboard", label: "Dashboard" },
        ...(isOperator ? [{ href: "/console", label: "Cases" }] : []),
        ...(isOperator && canReview
          ? [{ href: "/review", label: "Review" }]
          : []),
      ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  function navLink(item: NavItem, onNavigate?: () => void) {
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          isActive(item.href)
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold"
        >
          <Building2 className="size-5" />
          <span>CivicLedger</span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {items.map((i) => navLink(i))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:ml-3 md:flex">
          {isSignedIn ? (
            <>
              {email && (
                <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {email}
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut />
                Sign out
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

        {/* Mobile trigger */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="ml-auto md:hidden"
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {items.map((i) => navLink(i, () => setMenuOpen(false)))}
          </nav>

          <div className="mt-3 border-t border-border pt-3">
            {isSignedIn ? (
              <>
                {email && (
                  <p className="mb-2 truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                >
                  <LogOut />
                  Sign out
                </Button>
              </>
            ) : (
              <Link
                href="/console/sign-in"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                <LogIn className="size-4" />
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
