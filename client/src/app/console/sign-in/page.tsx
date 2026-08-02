import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { SessionWithOperator } from "@/auth.config";
import { SignInForm } from "./SignInForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Auth.js error codes are redirected here by `pages.error`. `NotAnOperator` is
 * our own code, set by middleware when a signed-in citizen tries to reach a
 * console.
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

  // Already signed in: send them on, unless they were bounced here for lacking
  // operator access, in which case the message below needs to be shown.
  if (session && error !== "NotAnOperator") {
    redirect(callbackUrl ?? (session.operator ? "/console" : "/report"));
  }

  const message = error ? (ERROR_MESSAGES[error] ?? FALLBACK_ERROR) : null;

  // Where they were heading tells us who they are, so the copy can match.
  const target = callbackUrl ?? "";
  const forReporting = target.startsWith("/report");

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="auth-eyebrow">
          {forReporting ? "Report an issue" : "Sign in"}
        </span>
        <h1 className="auth-title">
          {forReporting ? "Sign in to continue" : "Sign in to CivicLedger"}
        </h1>
        <p className="muted auth-subtitle">
          {forReporting
            ? "Reports are tied to an account so we can keep you updated and keep the queue free of duplicates and spam."
            : "Residents can sign in to file and follow reports. City staff reach the department and review consoles with the same account."}
        </p>

        {message && (
          <div className="auth-error" role="alert">
            {message}
          </div>
        )}

        <SignInForm
          devMode={process.env.NODE_ENV !== "production"}
          callbackUrl={callbackUrl ?? "/report"}
        />
      </div>

      <p className="muted auth-foot">
        Just looking? <Link href="/dashboard">Browse the public dashboard</Link>{" "}
        — no account needed.
      </p>
    </div>
  );
}
