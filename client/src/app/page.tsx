import Link from "next/link";
import { getOperator } from "@/lib/session";
import { PageContainer } from "@/components/shell/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

const PROMISES = [
  [
    "Emergencies never wait on a model.",
    "A deterministic check runs first and tells you to call emergency services.",
  ],
  [
    "Low-confidence reports go to a human.",
    "Nothing is auto-routed unless the classifier is sure enough.",
  ],
  [
    "Closing a case needs evidence.",
    "Either a proof photo or a recorded reason code.",
  ],
  [
    "Public views carry no personal data.",
    "Enforced by the database, not by convention.",
  ],
];

export default async function HomePage() {
  const operator = await getOperator();

  return (
    <PageContainer>
      <section className="pb-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
          Civic issue reporting
        </span>
        <h1 className="mt-3 text-3xl font-semibold leading-[1.14] tracking-tight sm:text-4xl lg:text-[42px]">
          Report a problem.
          <br />
          Watch it actually get fixed.
        </h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-[17px]">
          CivicLedger routes every report to the department that owns it, holds
          that department to a deadline, and publishes the outcome. The same
          record the city works from is the one you can see.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/report"
            className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
          >
            Report an issue
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            View the public dashboard
          </Link>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          {operator ? (
            <>
              Signed in as {operator.email} —{" "}
              <Link href="/console" className="underline">
                open your console
              </Link>
              .
            </>
          ) : (
            "Reporting takes a quick sign-in. Browsing the dashboard doesn't."
          )}
        </p>
      </section>

      <Separator />

      <section
        aria-label="How it works"
        className="grid gap-3 py-9 sm:grid-cols-2 lg:grid-cols-4"
      >
        {STEPS.map((step) => (
          <Card key={step.n}>
            <CardContent className="p-4 pt-4">
              <span className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground">
                {step.n}
              </span>
              <h2 className="mt-2 text-base font-semibold">{step.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator />

      <section className="pt-8">
        <h2 className="mb-4 text-lg font-semibold">
          Built so the record can be trusted
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PROMISES.map(([lead, rest]) => (
            <li key={lead} className="relative pl-5 text-sm leading-relaxed">
              <span className="absolute left-0 top-[7px] size-2 rounded-sm bg-border" />
              <strong className="font-semibold text-foreground">{lead}</strong>{" "}
              <span className="text-muted-foreground">{rest}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}
