"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterState {
  category: string;
  status: string;
  dateRange: string;
}

/** Unfiltered baseline. "Applied" means anything differing from this. */
export const DEFAULT_FILTERS: FilterState = {
  category: "",
  status: "",
  dateRange: "7",
};

function isDefault(state: FilterState) {
  return (
    state.category === DEFAULT_FILTERS.category &&
    state.status === DEFAULT_FILTERS.status &&
    state.dateRange === DEFAULT_FILTERS.dateRange
  );
}

const GROUPS = [
  { id: "category", label: "Category" },
  { id: "status", label: "Status" },
  { id: "date", label: "Date" },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

const OPTIONS: Record<GroupId, { value: string; label: string }[]> = {
  category: [
    { value: "", label: "All categories" },
    { value: "Pothole", label: "Pothole" },
    { value: "Graffiti", label: "Graffiti" },
    { value: "Trash", label: "Trash" },
    { value: "Streetlight", label: "Streetlight" },
  ],
  status: [
    { value: "", label: "All" },
    { value: "Active", label: "Active" },
    { value: "Resolved", label: "Resolved" },
  ],
  date: [
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "all", label: "All Time" },
  ],
};

const KEY_BY_GROUP: Record<GroupId, keyof FilterState> = {
  category: "category",
  status: "status",
  date: "dateRange",
};

/**
 * Filter and sort control for the dashboard.
 *
 * The filters used to occupy a permanent left column, which collided with the
 * navigation sidebar - two rails side by side, neither of them content. They now
 * live behind a single control in the page header and open as a panel, so the
 * map and metrics get the full width.
 *
 * Selections are staged in a draft and only committed on Apply, so a half-made
 * choice never triggers a refetch, and Cancel genuinely reverts.
 */
export function DashboardFilters({
  value,
  onApply,
}: {
  value: FilterState;
  onApply: (next: FilterState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<GroupId>("category");
  const [draft, setDraft] = useState<FilterState>(value);
  const panelRef = useRef<HTMLDivElement>(null);

  // Re-sync the draft whenever the panel opens, so it always reflects what is
  // currently applied rather than an abandoned edit.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // Close on Escape, matching the dismiss behaviour of a modal surface.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const activeCount =
    (value.category ? 1 : 0) +
    (value.status ? 1 : 0) +
    (value.dateRange !== DEFAULT_FILTERS.dateRange ? 1 : 0);

  function select(option: string) {
    setDraft((d) => ({ ...d, [KEY_BY_GROUP[group]]: option }));
  }

  return (
    <div className="relative">
      <Button
        variant={open ? "secondary" : "outline"}
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="gap-2"
      >
        <SlidersHorizontal />
        <span className="hidden sm:inline">Filter</span>
        {activeCount > 0 && (
          <span className="tabular grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Click-away layer. */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-label="Filter and sort"
            className="absolute right-0 z-50 mt-2 w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold">Filter &amp; Sort</h2>
            </div>

            <div className="grid grid-cols-[8.5rem_1fr] sm:grid-cols-[10rem_1fr]">
              {/* Group list */}
              <div className="flex flex-col gap-1 border-r border-border p-2.5">
                {GROUPS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGroup(g.id)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      group === g.id
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Options for the selected group */}
              <div className="flex max-h-[15rem] flex-col gap-1 overflow-y-auto p-2.5">
                {OPTIONS[group].map((o) => {
                  const selected = draft[KEY_BY_GROUP[group]] === o.value;
                  return (
                    <button
                      key={o.value || "all"}
                      onClick={() => select(o.value)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        selected
                          ? "bg-accent/60 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                      )}
                    >
                      {o.label}
                      {selected && <Check className="size-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              {/* Clears the draft rather than applying immediately, so Reset
                  behaves like every other choice in this panel: nothing takes
                  effect until Apply, and Cancel still abandons it. */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isDefault(draft)}
                onClick={() => setDraft(DEFAULT_FILTERS)}
                className="text-muted-foreground"
              >
                <RotateCcw />
                Reset
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onApply(draft);
                    setOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Human label for a stored filter value. */
function labelFor(group: GroupId, value: string) {
  return OPTIONS[group].find((o) => o.value === value)?.label ?? value;
}

/**
 * Applied filters, shown beside the control.
 *
 * The panel is closed most of the time, so without this the only signal that a
 * filter is narrowing the data was a count badge - enough to notice, not enough
 * to know what was excluded. Each chip clears just its own filter.
 */
export function ActiveFilterChips({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const chips: { key: keyof FilterState; label: string }[] = [];

  if (value.category) {
    chips.push({
      key: "category",
      label: labelFor("category", value.category),
    });
  }
  if (value.status) {
    chips.push({ key: "status", label: labelFor("status", value.status) });
  }
  if (value.dateRange !== DEFAULT_FILTERS.dateRange) {
    chips.push({ key: "dateRange", label: labelFor("date", value.dateRange) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 py-1 pl-3 pr-1.5 text-xs font-medium"
        >
          {chip.label}
          <button
            onClick={() =>
              onChange({ ...value, [chip.key]: DEFAULT_FILTERS[chip.key] })
            }
            aria-label={`Remove ${chip.label} filter`}
            className="grid size-4 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
