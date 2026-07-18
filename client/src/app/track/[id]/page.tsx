"use client";

import { use, useEffect, useState } from "react";

interface Status {
  reportId: string;
  status: string;
  moderationStatus: string;
  routingPath: string | null;
  caseId: string | null;
  caseStatus: string | null;
  createdAt: string;
}

export default function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch(`/api/v1/reports/${id}`);
        if (!res.ok) {
          if (active) setError("Report not found.");
          return;
        }
        const data = await res.json();
        if (active) setStatus(data);
      } catch {
        if (active) setError("Could not load status.");
      }
    }
    poll();
    const t = setInterval(poll, 30000); // PRD 3.5: 30s polling
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [id]);

  if (error) return <div className="banner">{error}</div>;
  if (!status) return <p className="muted">Loading status...</p>;

  return (
    <div>
      <h1>Report status</h1>
      <div className="card">
        <p>
          <strong>Status:</strong> {status.status}
        </p>
        <p className="muted">Moderation: {status.moderationStatus}</p>
        {status.routingPath && (
          <p className="muted">Routing: {status.routingPath}</p>
        )}
        {status.caseId ? (
          <p>
            Linked case:{" "}
            <a href={`/cases/${status.caseId}`}>{status.caseId.slice(0, 8)}</a>{" "}
            ({status.caseStatus})
          </p>
        ) : (
          <p className="muted">Not yet linked to a case.</p>
        )}
        <p className="muted">
          Submitted {new Date(status.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
