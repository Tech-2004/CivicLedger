"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  ClipboardList,
  ListChecks,
  LogIn,
  LogOut,
  PanelLeft,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "civicledger:sidebar-collapsed";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({
  isSignedIn,
  isOperator,
  canReview,
  email,
  role,
}: {
  isSignedIn: boolean;
  isOperator: boolean;
  canReview: boolean;
  email: string | null;
  role: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Read the stored preference after mount; reading it during render would
  // desync the server and client HTML.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setMobileOpen(false), [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const residentItems: NavItem[] = [
    { href: "/report", label: "Report an issue", icon: Plus },
    { href: "/dashboard", label: "Public dashboard", icon: BarChart3 },
  ];

  const staffItems: NavItem[] = [
    { href: "/console", label: "Cases", icon: ClipboardList },
    ...(canReview
      ? [{ href: "/review", label: "Review queue", icon: ListChecks }]
      : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  function renderItem({ href, label, icon: Icon }: NavItem) {
    return (
      <Link
        key={href}
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          isActive(href)
            ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile trigger - hidden once the sidebar is permanent. */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed left-3 top-3 z-40 bg-sidebar md:hidden"
      >
        <PanelLeft />
      </Button>

      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={cn(
          "z-50 flex h-screen shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-3",
          "fixed inset-y-0 left-0 transition-transform duration-200 md:sticky md:top-0 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-[64px]" : "w-[248px]",
        )}
      >
        {/* Brand + collapse toggle */}
        <div className="flex items-center gap-1.5 px-1 pb-2">
          <Link
            href="/"
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 font-semibold text-sidebar-foreground",
              collapsed && "justify-center",
            )}
          >
            <Building2 className="size-5 shrink-0" />
            {!collapsed && <span className="truncate">CivicLedger</span>}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="size-8 text-muted-foreground"
            >
              <PanelLeft />
            </Button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-0.5">
            {!collapsed && (
              <span className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Residents
              </span>
            )}
            {residentItems.map(renderItem)}
          </div>

          {isOperator && (
            <div className="flex flex-col gap-0.5">
              {!collapsed && (
                <span className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Staff
                </span>
              )}
              {staffItems.map(renderItem)}
            </div>
          )}
        </nav>

        {/* Identity + session controls */}
        <div className="flex flex-col gap-0.5 border-t border-sidebar-border pt-2">
          {isSignedIn ? (
            <>
              <div
                title={email ?? undefined}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2",
                  collapsed && "justify-center px-0",
                )}
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-accent text-xs font-bold"
                >
                  {(email ?? "?").charAt(0).toUpperCase()}
                </span>
                {!collapsed && (
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-[13px]">{email}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      {role ?? "resident"}
                    </span>
                  </span>
                )}
              </div>
              <button
                onClick={() => void signOut({ callbackUrl: "/" })}
                title={collapsed ? "Sign out" : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <LogOut className="size-4 shrink-0" />
                {!collapsed && "Sign out"}
              </button>
            </>
          ) : (
            <Link
              href="/console/sign-in"
              title={collapsed ? "Sign in" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <LogIn className="size-4 shrink-0" />
              {!collapsed && "Sign in"}
            </Link>
          )}

          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              className="mx-auto size-8 text-muted-foreground"
            >
              <PanelLeft className="rotate-180" />
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
