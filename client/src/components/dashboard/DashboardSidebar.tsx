"use client";

import type { PublicCase } from "@civicledger/shared";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  category: string;
  setCategory: (cat: string) => void;
  status: string;
  setStatus: (stat: string) => void;
  cases: PublicCase[];
}

const CATEGORIES = ["Pothole", "Graffiti", "Trash", "Streetlight"];
const STATUSES = ["All", "Active", "Resolved"];

/** Matches the monochrome pin scale in MapView. */
const DOT_STYLES = {
  new: "bg-primary",
  progress: "bg-muted-foreground",
  resolved: "bg-transparent ring-2 ring-inset ring-border",
} as const;

function statusKey(status: string): keyof typeof DOT_STYLES {
  if (status === "RESOLVED") return "resolved";
  if (status === "IN_PROGRESS") return "progress";
  return "new";
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary/50 text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Filter rail for the dashboard. This is a secondary, content-level panel - the
 * primary navigation lives in the app sidebar, so this one carries filters only.
 */
export function DashboardSidebar({
  category,
  setCategory,
  status,
  setStatus,
  cases,
}: DashboardSidebarProps) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-b border-border p-4 sm:gap-6 sm:p-5 lg:w-[290px] lg:border-b-0 lg:border-r">
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Category
        </span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Pill
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? "" : c)}
            >
              {c}
            </Pill>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Status
        </span>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Pill
              key={s}
              active={status === s || (!status && s === "All")}
              onClick={() => setStatus(s === "All" ? "" : s)}
            >
              {s}
            </Pill>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="date-range">Date</Label>
        <Select id="date-range" defaultValue="7">
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="all">All Time</option>
        </Select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Recent Reports
        </span>
        <div className="flex flex-col gap-2.5 overflow-y-auto">
          {cases.slice(0, 10).map((c) => (
            <div
              key={c.id}
              className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-3"
            >
              <div className="size-[52px] shrink-0 rounded bg-gradient-to-br from-secondary to-accent" />
              <div className="flex min-w-0 flex-col justify-center">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  #{(c.id.split("-")[0] || c.id).toUpperCase()}
                </span>
                <span className="truncate text-[13px] font-medium capitalize">
                  {c.category}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      DOT_STYLES[statusKey(c.status)],
                    )}
                  />
                  {c.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
          {cases.length === 0 && (
            <p className="text-sm text-muted-foreground">No cases found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
