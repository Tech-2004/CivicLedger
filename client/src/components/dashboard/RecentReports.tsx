"use client";

import Link from "next/link";
import type { PublicCase } from "@civicledger/shared";
import { Badge, slaBadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/**
 * Recent reports strip. Previously buried at the bottom of the filter column; now
 * a content section in its own right, since it is data rather than a control.
 *
 * Each card links through to the public case, and carries the same SLA badge the
 * console uses, so the two views agree on what a case's status looks like.
 */
export function RecentReports({ cases }: { cases: PublicCase[] }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-medium text-muted-foreground">
          Recent reports
        </h2>
        {cases.length > 6 && (
          <span className="tabular text-[11px] text-muted-foreground">
            showing 6 of {cases.length}
          </span>
        )}
      </div>

      {cases.length === 0 ? (
        <Card className="grid place-items-center p-8">
          <p className="text-sm text-muted-foreground">No cases found.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cases.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`} className="no-underline">
              <Card hoverable className="flex h-full gap-3 p-3">
                <div className="size-11 shrink-0 rounded-md border border-border bg-secondary" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular text-[11px] text-muted-foreground">
                      #{(c.id.split("-")[0] || c.id).toUpperCase()}
                    </span>
                    <Badge variant={slaBadgeVariant[c.slaBadge]} dot>
                      {c.slaBadge.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="truncate text-[13px] font-medium capitalize text-foreground">
                    {c.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {c.reportCount} report{c.reportCount === 1 ? "" : "s"}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
