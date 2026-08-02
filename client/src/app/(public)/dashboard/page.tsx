"use client";

import { useEffect, useState } from "react";
import type { PublicCase } from "@civicledger/shared";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { MapView } from "@/components/dashboard/MapView";

interface Rollup {
  category: string;
  status: string;
  case_count: number;
  overdue_count: number;
  avg_resolution_seconds: number | null;
}

/**
 * Full-bleed screen: it fills the shell's content pane rather than sitting in
 * the standard reading column. The app sidebar supplies navigation, so this page
 * only owns its own filter rail and content.
 */
export default function DashboardPage() {
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [rollups, setRollups] = useState<Rollup[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border px-6 pb-4 pt-14 md:pt-6">
        <h1 className="text-xl font-semibold tracking-tight">
          Public Reporting Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          City of Springfield — refreshed every 30 seconds.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <DashboardSidebar
          category={category}
          setCategory={setCategory}
          status={status}
          setStatus={setStatus}
          cases={cases}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-5 p-5">
          <MetricCards
            activeReports={activeReports}
            resolvedReports={resolvedReports}
            avgResDays={avgResDays}
          />
          <div className="flex min-h-[420px] flex-1">
            <MapView cases={cases} />
          </div>
        </div>
      </div>
    </div>
  );
}
