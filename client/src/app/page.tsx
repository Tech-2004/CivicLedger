import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1>CivicLedger</h1>
      <p className="muted">
        Report something, it gets triaged and routed correctly, a department
        resolves it, and the public sees accurate status.
      </p>

      <div className="grid" style={{ marginTop: 24 }}>
        <Link className="card" href="/report">
          <h2 style={{ marginTop: 0 }}>Report an issue</h2>
          <p className="muted">
            Photo, location, and an optional description. Anonymous by default.
          </p>
        </Link>
        <Link className="card" href="/dashboard">
          <h2 style={{ marginTop: 0 }}>Public dashboard</h2>
          <p className="muted">
            Map + list of open cases with live SLA status.
          </p>
        </Link>
        <Link className="card" href="/console">
          <h2 style={{ marginTop: 0 }}>Department console</h2>
          <p className="muted">Triage, update, and resolve assigned cases.</p>
        </Link>
      </div>
    </div>
  );
}
