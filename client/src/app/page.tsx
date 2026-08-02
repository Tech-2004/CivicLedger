import Link from "next/link";
import { getOperator } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "01",
    title: "Report",
    body: "Snap a photo, confirm the location, add a note if you want. Your details stay off the public record.",
  },
  {
    n: "02",
    title: "Triage",
    body: "Emergencies are flagged before any model runs. Everything else is classified, deduplicated, and routed.",
  },
  {
    n: "03",
    title: "Resolve",
    body: "The owning department works the case against an SLA clock and closes it with proof.",
  },
  {
    n: "04",
    title: "Verify",
    body: "Status, timeline, and resolution are public. No personal information, ever.",
  },
];

export default async function HomePage() {
  // Show operators a route back into their console instead of a sign-in link.
  const operator = await getOperator();

  return (
    <div className="landing">
      <section className="hero">
        <span className="hero-eyebrow">Civic issue reporting</span>
        <h1 className="hero-title">
          Report a problem.
          <br />
          Watch it actually get fixed.
        </h1>
        <p className="hero-lede">
          CivicLedger routes every report to the department that owns it, holds
          that department to a deadline, and publishes the outcome. The same
          record the city works from is the one you can see.
        </p>

        <div className="hero-actions">
          <Link className="btn-primary" href="/report">
            Report an issue
          </Link>
          <Link className="btn-ghost" href="/dashboard">
            View the public dashboard
          </Link>
        </div>

        <p className="muted hero-note">
          {operator ? (
            <>
              Signed in as {operator.email} —{" "}
              <Link href="/console">open your console</Link>.
            </>
          ) : (
            <>
              Reporting takes a quick sign-in. Browsing the dashboard doesn&apos;t.
            </>
          )}
        </p>
      </section>

      <section className="steps" aria-label="How it works">
        {STEPS.map((step) => (
          <article key={step.n} className="step-card">
            <span className="step-n">{step.n}</span>
            <h2 className="step-title">{step.title}</h2>
            <p className="muted step-body">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="promise">
        <h2 className="promise-title">Built so the record can be trusted</h2>
        <ul className="promise-list">
          <li>
            <strong>Emergencies never wait on a model.</strong> A deterministic
            check runs first and tells you to call emergency services.
          </li>
          <li>
            <strong>Low-confidence reports go to a human.</strong> Nothing is
            auto-routed unless the classifier is sure enough.
          </li>
          <li>
            <strong>Closing a case needs evidence.</strong> Either a proof photo
            or a recorded reason code.
          </li>
          <li>
            <strong>Public views carry no personal data.</strong> Enforced by the
            database, not by convention.
          </li>
        </ul>
      </section>
    </div>
  );
}
