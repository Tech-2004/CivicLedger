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
          <span className="status-dot status-red"></span> Awaiting Triage
        </div>
        <div>
          <span className="status-dot status-orange"></span> In Progress
        </div>
        <div>
          <span className="status-dot status-green"></span> Resolved
        </div>
      </div>

      {cases.map((c) => {
        const hash = c.id
          .split("")
          .reduce((a, b) => a + b.charCodeAt(0), 0);
        const top = 10 + (hash % 80);
        const left = 10 + ((hash * 3) % 80);

        const statusColor =
          c.status === "RESOLVED"
            ? "#2ea043"
            : c.status === "IN_PROGRESS"
            ? "#d29922"
            : "#f85149";

        return (
          <div
            key={c.id}
            className="map-pin"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              backgroundColor: statusColor,
            }}
            title={`${c.category} - ${c.status}`}
          />
        );
      })}
    </div>
  );
}
