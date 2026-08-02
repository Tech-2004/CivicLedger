import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { SessionWithOperator } from "@/auth.config";
import { SignInForm } from "./SignInForm";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `NotAnOperator` is our own code, set by middleware when a signed-in resident
 * tries to reach a console. The rest are Auth.js codes routed here by
 * `pages.error`.
 */
const ERROR_MESSAGES: Record<string, string> = {
  NotAnOperator:
    "You're signed in, but this area is limited to city staff. If you should have access, ask an administrator to register your email address.",
  Configuration:
    "Sign-in isn't configured correctly. If you're running this locally, check that AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set.",
  OAuthAccountNotLinked:
    "That email is already associated with a different sign-in method.",
  AccessDenied: "That account can't be used to sign in.",
  Verification: "That sign-in link has expired. Please request a new one.",
};

const FALLBACK_ERROR = "Something went wrong signing you in. Please try again.";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const session = (await auth()) as SessionWithOperator | null;

  // Already signed in: move them along, unless they were bounced here for
  // lacking operator access, in which case the message must be shown.
  if (session && error !== "NotAnOperator") {
    redirect(callbackUrl ?? (session.operator ? "/console" : "/report"));
  }

  const message = error ? (ERROR_MESSAGES[error] ?? FALLBACK_ERROR) : null;
  const forReporting = (callbackUrl ?? "").startsWith("/report");

  return (
    <div className="mx-auto w-full max-w-[400px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <Card>
        <CardContent className="p-5 pt-5 sm:p-7 sm:pt-7">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {forReporting ? "Report an issue" : "Sign in"}
          </span>
          <h1 className="mt-2.5 text-xl font-semibold">
            {forReporting ? "Sign in to continue" : "Sign in to CivicLedger"}
          </h1>
          <p className="mb-6 mt-2 text-sm text-muted-foreground">
            {forReporting
              ? "Reports are tied to an account so we can keep you updated and keep the queue free of duplicates and spam."
              : "Residents can sign in to file and follow reports. City staff reach the department and review consoles with the same account."}
          </p>

          {message && (
            <Alert variant="notice" className="mb-5">
              {message}
            </Alert>
          )}

          <SignInForm
            devMode={process.env.NODE_ENV !== "production"}
            callbackUrl={callbackUrl ?? "/report"}
          />
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Just looking?{" "}
        <Link href="/dashboard" className="underline">
          Browse the public dashboard
        </Link>{" "}
        — no account needed.
      </p>
    </div>
  );
}
