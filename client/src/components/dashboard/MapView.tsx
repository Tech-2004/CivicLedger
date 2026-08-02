"use client";

import type { PublicCase } from "@civicledger/shared";
import { cn } from "@/lib/utils";

interface MapViewProps {
  cases: PublicCase[];
}

/**
 * Monochrome status scale: urgency reads as brightness rather than hue. Awaiting
 * triage is brightest, resolved recedes to a hollow ring. Always paired with the
 * text legend, so state never depends on colour perception alone.
 */
const PIN_STYLES = {
  new: "bg-primary",
  progress: "bg-muted-foreground",
  resolved: "bg-transparent ring-2 ring-inset ring-border",
} as const;

function statusKey(status: string): keyof typeof PIN_STYLES {
  if (status === "RESOLVED") return "resolved";
  if (status === "IN_PROGRESS") return "progress";
  return "new";
}

export function MapView({ cases }: MapViewProps) {
  return (
    <div
      className="relative flex-1 overflow-hidden rounded-xl border border-border bg-background"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-x-3 gap-y-1 rounded-xl border border-border bg-card/90 px-3 py-2 text-[11px] font-medium backdrop-blur sm:right-4 sm:top-4 sm:rounded-full sm:text-xs">
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", PIN_STYLES.new)} />
          Awaiting Triage
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", PIN_STYLES.progress)} />
          In Progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", PIN_STYLES.resolved)} />
          Resolved
        </span>
      </div>

      {cases.map((c) => {
        // Placeholder projection until a real map library is wired to
        // case.location - deterministic so pins don't jump between renders.
        const hash = c.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
        const top = 10 + (hash % 80);
        const left = 10 + ((hash * 3) % 80);

        return (
          <div
            key={c.id}
            title={`${c.category} - ${c.status}`}
            style={{ top: `${top}%`, left: `${left}%` }}
            className={cn(
              "absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-lg",
              PIN_STYLES[statusKey(c.status)],
            )}
          />
        );
      })}
    </div>
  );
}
