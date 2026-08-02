"use client";

import type { PublicCase } from "@civicledger/shared";
import { cn } from "@/lib/utils";

/**
 * Monochrome status scale, matching the map pins: urgency reads as brightness
 * rather than hue, and the text label always accompanies the dot.
 */
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

/**
 * Recent reports strip. Previously buried at the bottom of the filter column;
 * now a content section in its own right, since it is data rather than a control.
 */
export function RecentReports({ cases }: { cases: PublicCase[] }) {
  return (
    <section>
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Recent Reports
      </h2>

      {cases.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cases found.</p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {cases.slice(0, 6).map((c) => (
            <div
              key={c.id}
              className="flex gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="size-12 shrink-0 rounded bg-gradient-to-br from-secondary to-accent" />
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
        </div>
      )}
    </section>
  );
}
