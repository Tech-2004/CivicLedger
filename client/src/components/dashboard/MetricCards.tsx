"use client";

import { Card, CardContent } from "@/components/ui/card";

interface MetricCardsProps {
  activeReports: number;
  resolvedReports: number;
  avgResDays: string;
}

/**
 * Decorative emoji were removed: they render in their own colours regardless of
 * CSS, which breaks the monochrome scheme, and duplicated the labels.
 */
export function MetricCards({
  activeReports,
  resolvedReports,
  avgResDays,
}: MetricCardsProps) {
  const metrics = [
    {
      title: "Active Reports",
      value: activeReports,
      sub: "Trend over 30 days",
    },
    {
      title: "Reports This Week",
      value: Math.floor(activeReports * 0.4),
      sub: "Last 7 days",
    },
    {
      title: "Resolved (30d)",
      value: resolvedReports,
      sub: "Across all categories",
    },
    {
      title: "Avg. Resolution Time",
      value: `${avgResDays} days`,
      sub: "+0.2 days vs prev. month",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.title} className="bg-card/85 backdrop-blur">
          <CardContent className="flex flex-col p-4 pt-4">
            <span className="text-[13px] font-medium text-muted-foreground">
              {m.title}
            </span>
            <span className="tabular mt-2 text-[28px] font-bold leading-none">
              {m.value}
            </span>
            <span className="mt-1.5 text-[11px] text-muted-foreground">
              {m.sub}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
