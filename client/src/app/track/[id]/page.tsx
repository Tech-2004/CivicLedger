"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PageContainer } from "@/components/shell/PageContainer";
import { PageHeader } from "@/components/shell/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <PageContainer>
      <PageHeader
        title="Report status"
        description="This page refreshes itself every 30 seconds."
      />

      {error && <Alert variant="notice">{error}</Alert>}
      {!error && !status && <Skeleton className="h-40 w-full" />}

      {status && (
        <Card>
          <CardContent className="flex flex-col gap-2 p-5 pt-5 text-sm">
            <p>
              <span className="text-muted-foreground">Status: </span>
              <span className="font-medium">{status.status}</span>
            </p>
            <p className="text-muted-foreground">
              Moderation: {status.moderationStatus}
            </p>
            {status.routingPath && (
              <p className="text-muted-foreground">
                Routing: {status.routingPath}
              </p>
            )}
            {status.caseId ? (
              <p>
                <span className="text-muted-foreground">Linked case: </span>
                <Link href={`/cases/${status.caseId}`} className="underline">
                  {status.caseId.slice(0, 8)}
                </Link>{" "}
                <span className="text-muted-foreground">
                  ({status.caseStatus})
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Not yet linked to a case.
              </p>
            )}
            <p className="text-muted-foreground">
              Submitted {new Date(status.createdAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
