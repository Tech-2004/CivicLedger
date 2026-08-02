"use client";

import { useEffect, useState } from "react";
import type { PublicCase } from "@civicledger/shared";
import {
  DashboardFilters,
  type FilterState,
} from "@/components/dashboard/DashboardFilters";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { MapView } from "@/components/dashboard/MapView";
import { RecentReports } from "@/components/dashboard/RecentReports";

interface Rollup {
  category: string;
  status: string;
  case_count: number;
  overdue_count: number;
  avg_resolution_seconds: number | null;
}

/**
 * Full-bleed screen: it fills the shell's content pane rather than sitting in the
 * standard reading column. Navigation is the app sidebar's job and filters live
 * behind the header control, so this page owns only its data.
 */
export default function DashboardPage() {
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [rollups, setRollups] = useState<Rollup[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    status: "",
    dateRange: "7",
  });

  const { category, status } = filters;

  useEffect(() => {
    let active = true;
    async function load() {
      const qs = new URLSearchParams();
      if (category) qs.set("category", category);
      if (status === "Resolved") qs.set("status", "RESOLVED");
      else if (status === "Active") qs.set("status", "IN_PROGRESS");
      else if (status && status !== "All") qs.set("status", status.toUpperCase());

      const [c, r] = await Promise.all([
        fetch(`/api/v1/public/cases?${qs}`).then((x) => x.json()),
        fetch(`/api/v1/public/rollups`).then((x) => x.json()),
      ]);
      if (!active) return;
      setCases(c.cases ?? []);
      setRollups(r.rollups ?? []);
    }
    load();
    const t = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [category, status]);

  const activeReports = rollups
    .filter((r) => r.status !== "RESOLVED" && r.status !== "WONT_FIX")
    .reduce((s, r) => s + r.case_count, 0);

  const resolvedReports = rollups
    .filter((r) => r.status === "RESOLVED")
    .reduce((s, r) => s + r.case_count, 0);

  let totalResolutionSecs = 0;
  let resolvedCount = 0;
  rollups.forEach((r) => {
    if (r.status === "RESOLVED" && r.avg_resolution_seconds) {
      totalResolutionSecs += r.avg_resolution_seconds * r.case_count;
      resolvedCount += r.case_count;
    }
  });

  const avgResDays =
    resolvedCount > 0
      ? (totalResolutionSecs / resolvedCount / 86400).toFixed(1)
      : "0.0";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            Public Reporting Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            City of Springfield — refreshed every 30 seconds.
          </p>
        </div>
        <DashboardFilters value={filters} onApply={setFilters} />
      </header>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <MetricCards
          activeReports={activeReports}
          resolvedReports={resolvedReports}
          avgResDays={avgResDays}
        />
        <div className="flex min-h-[320px] flex-1 sm:min-h-[420px]">
          <MapView cases={cases} />
        </div>
        <RecentReports cases={cases} />
      </div>
    </div>
  );
}
