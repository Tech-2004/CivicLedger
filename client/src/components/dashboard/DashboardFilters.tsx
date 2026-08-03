"use client";

import { useEffect, useState } from "react";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

interface Option {
  value: string;
  label: string;
}

const SECTIONS: {
  key: keyof FilterState;
  label: string;
  options: Option[];
}[] = [
  {
    key: "category",
    label: "Category",
    options: [
      { value: "", label: "All" },
      { value: "Pothole", label: "Pothole" },
      { value: "Graffiti", label: "Graffiti" },
      { value: "Trash", label: "Trash" },
      { value: "Streetlight", label: "Streetlight" },
    ],
  },
  {
    key: "status",
    label: "Status",
    options: [
      { value: "", label: "All" },
      { value: "Active", label: "Active" },
      { value: "Resolved", label: "Resolved" },
    ],
  },
  {
    key: "dateRange",
    label: "Date range",
    options: [
      { value: "7", label: "Last 7 days" },
      { value: "30", label: "Last 30 days" },
      { value: "all", label: "All time" },
    ],
  },
];

/** Human label for a stored filter value. */
function labelFor(key: keyof FilterState, value: string) {
  const section = SECTIONS.find((s) => s.key === key);
  return section?.options.find((o) => o.value === value)?.label ?? value;
}

/**
 * Filter control for the dashboard.
 *
 * A side sheet rather than a centred modal. The modal sat on top of the data it
 * was filtering and had to hide the groups behind a two-column tab switcher to
 * fit; the sheet is tall, so every group and option is visible at once and the
 * map stays in view beside it. On a phone it takes the full width instead of a
 * cramped inset.
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
  const [draft, setDraft] = useState<FilterState>(value);

  // Re-sync the draft on open, so it reflects what is applied rather than an
  // abandoned edit from last time.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const activeCount = SECTIONS.reduce(
    (n, s) => n + (value[s.key] !== DEFAULT_FILTERS[s.key] ? 1 : 0),
    0,
  );

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
          <span className="tabular grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filter</SheetTitle>
            <SheetDescription>
              Narrow the cases shown on the map and in the metrics.
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="flex flex-col gap-5">
            {SECTIONS.map((section) => (
              <div key={section.key} className="flex flex-col gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </span>
                <Segmented
                  ariaLabel={section.label}
                  options={section.options}
                  value={draft[section.key]}
                  onChange={(next) =>
                    setDraft((d) => ({ ...d, [section.key]: next }))
                  }
                />
              </div>
            ))}
          </SheetBody>

          <SheetFooter>
            {/* Clears the draft rather than applying straight away, so Reset
                behaves like every other choice here: nothing takes effect until
                Apply, and Cancel still abandons it. */}
            <Button
              variant="ghost"
              size="sm"
              disabled={isDefault(draft)}
              onClick={() => setDraft(DEFAULT_FILTERS)}
              className="mr-auto"
            >
              <RotateCcw />
              Reset
            </Button>
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
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * Applied filters, shown beside the control.
 *
 * The sheet is closed most of the time, so without this the only signal that a
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
  const chips = SECTIONS.filter(
    (s) => value[s.key] !== DEFAULT_FILTERS[s.key],
  ).map((s) => ({ key: s.key, label: labelFor(s.key, value[s.key]) }));

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
