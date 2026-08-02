"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
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
 * Collapsible navigation rail.
 *
 * Expanded it shows labels; collapsed it becomes an icon-only strip with the
 * labels moved to tooltips. On small screens it leaves the flow entirely and
 * slides in as an overlay drawer, so it never competes with page content.
 *
 * The dashboard has its own filter column beside this one - that panel is
 * content, this is navigation, so they are kept visually distinct: this rail uses
 * the sidebar surface token while the filter column sits on the page background.
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
            ? // Active row: bordered box plus a left accent bar, so it still reads
              // as selected once the rail is collapsed to icons only.
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
          // Desktop: part of the flow, directly under the sticky top bar.
          "md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:translate-x-0",
          collapsed ? "md:w-[64px]" : "md:w-[248px]",
        )}
      >
        {/* Collapse control sits at the top, so the nav items below never shift. */}
        <div
          className={cn(
            "hidden h-12 shrink-0 items-center px-2.5 md:flex",
            collapsed ? "justify-center" : "justify-end",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
            className="size-8 text-muted-foreground"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-2.5 pt-3 md:pt-0">
          {group("Menu", residentItems)}
          {isOperator && group("Staff", staffItems)}
        </nav>
      </aside>
    </>
  );
}
