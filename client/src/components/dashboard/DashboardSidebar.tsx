"use client";

import type { PublicCase } from "@civicledger/shared";

interface DashboardSidebarProps {
  category: string;
  setCategory: (cat: string) => void;
  status: string;
  setStatus: (stat: string) => void;
  cases: PublicCase[];
}

export function DashboardSidebar({
  category,
  setCategory,
  status,
  setStatus,
  cases,
}: DashboardSidebarProps) {
  return (
    <div className="dash-sidebar">
      <h1 className="dash-title">
        Public Reporting Dashboard -<br />
        City of Springfield
      </h1>

      <div className="filter-section">
        <div className="filter-title">Category</div>
        <div className="filter-pills">
          {["Pothole", "Graffiti", "Trash", "Streetlight"].map((c) => (
            <div
              key={c}
              className={`filter-pill ${category === c ? "active" : ""}`}
              onClick={() => setCategory(category === c ? "" : c)}
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-title">Status</div>
        <div className="filter-pills">
          {["All", "Active", "Resolved"].map((s) => (
            <div
              key={s}
              className={`filter-pill ${
                status === s || (!status && s === "All") ? "active" : ""
              }`}
              onClick={() => setStatus(s === "All" ? "" : s)}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-title">Date</div>
        <select className="date-select" defaultValue="7">
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="filter-title" style={{ marginTop: "16px" }}>
        Recent Reports
      </div>
      <div className="recent-reports">
        {cases.slice(0, 10).map((c) => {
          const statusColor =
            c.status === "RESOLVED"
              ? "status-green"
              : c.status === "IN_PROGRESS"
              ? "status-orange"
              : "status-red";

          return (
            <div className="report-card" key={c.id}>
              <div
                className="report-img"
                style={{
                  background: `linear-gradient(45deg, #1f242c, #30363d)`,
                }}
              ></div>
              <div className="report-info">
                <div className="report-id">
                  #{(c.id.split("-")[0] || c.id).toUpperCase()}
                </div>
                <div className="report-desc">
                  {c.category} | {c.location?.lat?.toFixed(4)},{" "}
                  {c.location?.lng?.toFixed(4)}
                </div>
                <div className="report-status">
                  <span className={`status-dot ${statusColor}`}></span>
                  {c.status.replace("_", " ")}
                </div>
              </div>
            </div>
          );
        })}
        {cases.length === 0 && <div className="muted">No cases found.</div>}
      </div>
    </div>
  );
}
