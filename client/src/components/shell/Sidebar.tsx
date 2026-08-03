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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import type { ChromeProps } from "./ShellChrome";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Full-height navigation rail.
 *
 * It owns the brand and the collapse control and spans the whole viewport height,
 * so the top bar begins to its right. That keeps a single vertical edge down the
 * page instead of an L-shaped seam.
 *
 * Collapsed it becomes an icon-only strip. Labels move into real tooltips rather
 * than `title` attributes, which are slow to appear and unstyled.
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
    const active = isActive(href);

    const link = (
      <Link
        href={href}
        onClick={onCloseMobile}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
          collapsed && "justify-center px-0",
          active
            ? "bg-accent font-medium text-foreground"
            : "font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
      >
        {/* Left accent bar marks the active row, and still reads once the rail is
            collapsed to icons only. */}
        {active && (
          <span
            aria-hidden="true"
            className="absolute -left-2.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-foreground"
          />
        )}
        <Icon className="size-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );

    if (!collapsed) return <div key={href}>{link}</div>;

    return (
      <Tooltip key={href} delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  function group(label: string, items: NavItem[]) {
    return (
      <div className="flex flex-col gap-0.5">
        {!collapsed && (
          <span className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
        {items.map(renderItem)}
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Scrim for the mobile drawer. */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={cn(
          "z-40 flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width,transform] duration-200",
          // Mobile: fixed overlay drawer.
          "fixed inset-y-0 left-0 w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: full height, part of the flow.
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
          collapsed ? "md:w-[60px]" : "md:w-[240px]",
        )}
      >
        {/* Fixed to the same height as the top bar and carrying the same bottom
            border, so the two rules meet and read as one continuous line. */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2 border-b border-border px-3",
            collapsed && "justify-center px-2",
          )}
        >
          {/* Collapsed the rail shows the toggle alone: the mark on its own said
              nothing the nav icons below don't already. */}
          {!collapsed && (
            <Link
              href="/"
              onClick={onCloseMobile}
              className="flex min-w-0 flex-1 items-center"
            >
              <Logo />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:inline-flex"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-2.5">
          {group("Menu", residentItems)}
          {isOperator && group("Staff", staffItems)}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
