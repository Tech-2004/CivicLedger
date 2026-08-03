"use client";

import type { PublicCase } from "@civicledger/shared";
import { cn } from "@/lib/utils";

interface MapViewProps {
  cases: PublicCase[];
}

/**
 * Status colours from the Geist ramps: red awaiting triage, amber in progress,
 * green resolved. The legend spells each one out, so the map never depends on
 * colour alone.
 */
const PIN = {
  new: { dot: "bg-red-900", ring: "ring-red-900/30", label: "Awaiting triage" },
  progress: {
    dot: "bg-amber-900",
    ring: "ring-amber-900/30",
    label: "In progress",
  },
  resolved: {
    dot: "bg-green-900",
    ring: "ring-green-900/30",
    label: "Resolved",
  },
} as const;

type PinKey = keyof typeof PIN;

function statusKey(status: string): PinKey {
  if (status === "RESOLVED") return "resolved";
  if (status === "IN_PROGRESS") return "progress";
  return "new";
}

export function MapView({ cases }: MapViewProps) {
  return (
    <div
      className="relative flex-1 overflow-hidden rounded-lg border border-border bg-background-elevated"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    >
      <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-x-3 gap-y-1 rounded-lg border border-border bg-popover/90 px-3 py-2 text-[11px] font-medium backdrop-blur sm:right-3 sm:top-3">
        {(Object.keys(PIN) as PinKey[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", PIN[k].dot)} />
            {PIN[k].label}
          </span>
        ))}
      </div>

      {cases.length === 0 && (
        <div className="absolute inset-0 grid place-items-center">
          <p className="text-sm text-muted-foreground">
            No cases match these filters.
          </p>
        </div>
      )}

      {cases.map((c) => {
        // Placeholder projection until a real map library is wired to
        // case.location - deterministic so pins don't jump between renders.
        const hash = c.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
        const top = 10 + (hash % 80);
        const left = 10 + ((hash * 3) % 80);
        const pin = PIN[statusKey(c.status)];

        return (
          <div
            key={c.id}
            title={`${c.category} — ${c.status.replace("_", " ")}`}
            style={{ top: `${top}%`, left: `${left}%` }}
            className={cn(
              "absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 transition-transform duration-150 hover:scale-125",
              pin.dot,
              pin.ring,
            )}
          />
        );
      })}
    </div>
  );
}
