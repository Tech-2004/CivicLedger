"use client";

interface MetricCardsProps {
  activeReports: number;
  resolvedReports: number;
  avgResDays: string;
}

export function MetricCards({
  activeReports,
  resolvedReports,
  avgResDays,
}: MetricCardsProps) {
  return (
    <div className="metrics-grid">
      {/* Decorative emoji were dropped: they render in their own colours
          regardless of CSS, which breaks the monochrome scheme, and they added
          no information the labels don't already carry. */}
      <div className="metric-card">
        <div className="metric-title">Active Reports</div>
        <div className="metric-value">{activeReports}</div>
        <div className="metric-sub">Trend over 30 days</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">Reports This Week</div>
        <div className="metric-value">{Math.floor(activeReports * 0.4)}</div>
        <div className="metric-sub">Last 7 Days</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">Resolved (30d)</div>
        <div className="metric-value">{resolvedReports}</div>
        <div className="metric-sub">Across all categories</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">Avg. Resolution Time</div>
        <div className="metric-value">{avgResDays} days</div>
        <div className="metric-sub">+0.2 days vs prev. month</div>
      </div>
    </div>
  );
}
