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
      <div className="metric-card">
        <div className="metric-title">
          Active Reports <span style={{ color: "#58a6ff" }}>📊</span>
        </div>
        <div className="metric-value">{activeReports}</div>
        <div className="metric-sub">Trend over 30 days</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">
          Reports This Week <span style={{ color: "#58a6ff" }}>📅</span>
        </div>
        <div className="metric-value">{Math.floor(activeReports * 0.4)}</div>
        <div className="metric-sub">Last 7 Days</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">
          Resolved (30d) <span style={{ color: "#2ea043" }}>✓</span>
        </div>
        <div className="metric-value">{resolvedReports}</div>
        <div className="metric-sub">Across all categories</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">
          Avg. Resolution Time <span style={{ color: "#d29922" }}>⚡</span>
        </div>
        <div className="metric-value">{avgResDays} days</div>
        <div className="metric-sub">+0.2 days vs prev. month</div>
      </div>
    </div>
  );
}
