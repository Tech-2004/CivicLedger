"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChromeProps } from "./ShellChrome";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Full-height navigation rail.
 *
 * It owns the brand and the collapse control, and spans the whole viewport
 * height, so the top bar begins to its right rather than crossing over it. That
 * keeps a single vertical edge down the page instead of an L-shaped seam.
 *
 * Collapsed it becomes an icon-only strip: the wordmark is hidden, labels move to
 * tooltips, and the collapse control moves below the mark since 64px cannot hold
 * both side by side.
 */
export function Sidebar({
  isOperator,
  canReview,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: Pick<ChromeProps, "isOperator" | "canReview"> & {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

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
        onClick={onCloseMobile}
        className={cn(
          "relative flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-sm transition-colors",
          collapsed && "justify-center px-0",
          isActive(href)
            ? // Bordered box plus a left accent bar, so selection still reads once
              // the rail is collapsed to icons only.
              "border-sidebar-border bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-x-[7px] before:-translate-y-1/2 before:rounded-full before:bg-primary"
            : "font-medium text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  function group(label: string, items: NavItem[]) {
    return (
      <div className="flex flex-col gap-0.5">
        {!collapsed && (
          <span className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
        {items.map(renderItem)}
      </div>
    );
  }

  const toggle = (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleCollapsed}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand" : "Collapse"}
      className="hidden size-8 shrink-0 text-muted-foreground md:inline-flex"
    >
      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
    </Button>
  );

  return (
    <>
      {/* Scrim for the mobile drawer. */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={cn(
          "z-40 flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200",
          // Mobile: fixed overlay drawer.
          "fixed inset-y-0 left-0 w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: full height, part of the flow.
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
          collapsed ? "md:w-[64px]" : "md:w-[248px]",
        )}
      >
        {/* Brand + collapse control.
            Fixed to the same 3.5rem height as the top bar and carrying the same
            bottom border, so the two rules meet and read as one continuous line
            across the app rather than stepping at the sidebar edge. */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2 border-b border-border px-3",
            collapsed && "justify-center px-2",
          )}
        >
          {/* Collapsed the rail shows the toggle alone: the mark on its own said
              nothing the nav icons below don't already, and stacking it above the
              toggle just crowded a 64px column. */}
          {!collapsed && (
            <Link
              href="/"
              onClick={onCloseMobile}
              className="flex min-w-0 flex-1 items-center gap-2 font-semibold text-sidebar-foreground"
            >
              <Building2 className="size-5 shrink-0" />
              <span className="truncate">CivicLedger</span>
            </Link>
          )}
          {toggle}
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-2.5">
          {group("Menu", residentItems)}
          {isOperator && group("Staff", staffItems)}
        </nav>
      </aside>
    </>
  );
}
