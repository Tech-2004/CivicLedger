"use client";

import type { PublicCase } from "@civicledger/shared";

interface MapViewProps {
  cases: PublicCase[];
}

export function MapView({ cases }: MapViewProps) {
  return (
    <div className="map-container">
      <div className="map-legend">
        <div>
          <span className="status-dot status-new"></span> Awaiting Triage
        </div>
        <div>
          <span className="status-dot status-progress"></span> In Progress
        </div>
        <div>
          <span className="status-dot status-resolved"></span> Resolved
        </div>
      </div>

      {cases.map((c) => {
        const hash = c.id
          .split("")
          .reduce((a, b) => a + b.charCodeAt(0), 0);
        const top = 10 + (hash % 80);
        const left = 10 + ((hash * 3) % 80);

        // Monochrome: the pin's brightness carries the status, matching the
        // legend above. Styling lives in dashboard.css rather than inline.
        const statusClass =
          c.status === "RESOLVED"
            ? "status-resolved"
            : c.status === "IN_PROGRESS"
              ? "status-progress"
              : "status-new";

        return (
          <div
            key={c.id}
            className={`map-pin ${statusClass}`}
            style={{ top: `${top}%`, left: `${left}%` }}
            title={`${c.category} - ${c.status}`}
          />
        );
      })}
    </div>
  );
}
