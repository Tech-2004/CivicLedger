"use client";

import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardsProps {
  activeReports: number;
  resolvedReports: number;
  avgResDays: string;
  overdueReports: number;
}

/**
 * Summary tiles.
 *
 * Each metric gets a tinted icon from the Geist ramps, which is enough to tell
 * them apart at a glance without turning the row into a rainbow: the figure stays
 * plain white and only the 20px glyph carries hue.
 */
export function MetricCards({
  activeReports,
  resolvedReports,
  avgResDays,
  overdueReports,
}: MetricCardsProps) {
  const metrics = [
    {
      title: "Active reports",
      value: activeReports,
      sub: "Open across all categories",
      icon: FileText,
      tint: "bg-blue-700/15 text-blue-900",
    },
    {
      title: "Overdue",
      value: overdueReports,
      sub: "Past their SLA deadline",
      icon: AlertTriangle,
      tint: "bg-red-700/15 text-red-900",
    },
    {
      title: "Resolved",
      value: resolvedReports,
      sub: "Closed with proof or reason",
      icon: CheckCircle2,
      tint: "bg-green-700/15 text-green-900",
    },
    {
      title: "Avg. resolution",
      value: `${avgResDays}d`,
      sub: "From report to close",
      icon: Clock,
      tint: "bg-amber-500/15 text-amber-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.title} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] text-muted-foreground">
              {m.title}
            </span>
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-md",
                m.tint,
              )}
            >
              <m.icon className="size-4" />
            </span>
          </div>
          <div className="tabular mt-3 text-2xl font-semibold tracking-tight sm:text-[28px]">
            {m.value}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{m.sub}</div>
        </Card>
      ))}
    </div>
  );
}
