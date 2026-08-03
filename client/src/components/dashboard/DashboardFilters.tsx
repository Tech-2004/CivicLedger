"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

/** Human label for a stored filter value. */
function labelFor(group: GroupId, value: string) {
  return OPTIONS[group].find((o) => o.value === value)?.label ?? value;
}

/**
 * Filter control for the dashboard.
 *
 * Built on the shadcn Dialog rather than the hand-rolled popover it replaces: the
 * old panel was anchored to the trigger and clipped off-screen on narrow
 * viewports, and it reimplemented focus handling, Escape and click-away by hand.
 * Radix gives a focus trap, scroll lock and correct aria wiring for free.
 *
 * Selections are staged in a draft and committed only on Apply, so a half-made
 * choice never triggers a refetch and Cancel genuinely reverts.
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

  // Re-sync the draft on open, so it reflects what is applied rather than an
  // abandoned edit from last time.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const activeCount =
    (value.category ? 1 : 0) +
    (value.status ? 1 : 0) +
    (value.dateRange !== DEFAULT_FILTERS.dateRange ? 1 : 0);

  function select(option: string) {
    setDraft((d) => ({ ...d, [KEY_BY_GROUP[group]]: option }));
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter</DialogTitle>
            <DialogDescription>
              Narrow the cases shown on the map and in the metrics.
            </DialogDescription>
          </DialogHeader>

          {/* Groups sit beside the options on wide screens and stack above them on
              narrow ones, so neither column gets squeezed to an unusable width. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
            <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2.5 sm:w-40 sm:flex-col sm:overflow-x-visible sm:border-b-0 sm:border-r">
              {GROUPS.map((g) => {
                const key = KEY_BY_GROUP[g.id];
                const set =
                  draft[key] !== DEFAULT_FILTERS[key] && draft[key] !== "";
                return (
                  <button
                    key={g.id}
                    onClick={() => setGroup(g.id)}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      group === g.id
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    {g.label}
                    {/* A dot marks groups holding a non-default value, so the user
                        can see where a filter lives without opening each one. */}
                    {set && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2.5">
              {OPTIONS[group].map((o) => {
                const selected = draft[KEY_BY_GROUP[group]] === o.value;
                return (
                  <button
                    key={o.value || "all"}
                    onClick={() => select(o.value)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "bg-accent/60 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                    )}
                  >
                    {o.label}
                    {selected && <Check className="size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDefault(draft)}
              onClick={() => setDraft(DEFAULT_FILTERS)}
              className="text-muted-foreground sm:mr-auto"
            >
              <RotateCcw />
              Reset
            </Button>

            <div className="flex items-center gap-2 sm:justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
                className="flex-1 sm:flex-none"
              >
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Applied filters, shown beside the control.
 *
 * The dialog is closed most of the time, so without this the only signal that a
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
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-secondary/60 py-1 pl-3 pr-1.5 text-xs font-medium"
        >
          <span className="truncate">{chip.label}</span>
          <button
            onClick={() =>
              onChange({ ...value, [chip.key]: DEFAULT_FILTERS[chip.key] })
            }
            aria-label={`Remove ${chip.label} filter`}
            className="grid size-4 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
