"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES, CASE_STATUSES } from "@civicledger/shared";
import type { PublicCase } from "@civicledger/shared";

interface Rollup {
  category: string;
  status: string;
  case_count: number;
  overdue_count: number;
}

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
      if (status) qs.set("status", status);
      const [c, r] = await Promise.all([
        fetch(`/api/v1/public/cases?${qs}`).then((x) => x.json()),
        fetch(`/api/v1/public/rollups`).then((x) => x.json()),
      ]);
      if (!active) return;
      setCases(c.cases ?? []);
      setRollups(r.rollups ?? []);
    }
    load();
    const t = setInterval(load, 30000); // PRD 3.5: 30s polling
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [category, status]);

  const totalCases = rollups.reduce((s, r) => s + r.case_count, 0);
  const totalOverdue = rollups.reduce((s, r) => s + r.overdue_count, 0);

  return (
    <div>
      <h1>Public dashboard</h1>

      <div className="grid">
        <div className="card">
          <div className="muted">Cases</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalCases}</div>
        </div>
        <div className="card">
          <div className="muted">Overdue</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--bad)" }}>
            {totalOverdue}
          </div>
        </div>
      </div>

      <div className="row" style={{ margin: "16px 0" }}>
        <select
          style={{ maxWidth: 200 }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          style={{ maxWidth: 200 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Map placeholder - wire a map lib (e.g. MapLibre) against case.location. */}
      <div
        className="card"
        style={{ height: 160, display: "grid", placeItems: "center" }}
      >
        <span className="muted">Map view (plot cases by location)</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Status</th>
            <th>Reports</th>
            <th>SLA</th>
            <th>Opened</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/cases/${c.id}`}>{c.category}</Link>
              </td>
              <td>{c.status}</td>
              <td>{c.reportCount}</td>
              <td>
                <span className={`badge ${c.slaBadge}`}>{c.slaBadge}</span>
              </td>
              <td className="muted">
                {new Date(c.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {cases.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No cases match these filters yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
