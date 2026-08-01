import Link from "next/link";
import { redirect } from "next/navigation";
import { getOperator } from "@/lib/session";
import { SignInForm } from "./SignInForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Auth.js error codes are redirected here by `pages.error`. `AccessDenied` is
 * the important one: it means Google authenticated the person successfully but
 * their email is not in the `operators` table.
 */
const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "That account isn't registered as an operator. Ask an administrator to add your email address, then try again.",
  Configuration:
    "Sign-in isn't configured correctly. If you're running this locally, check that AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set.",
  OAuthAccountNotLinked:
    "That email is already associated with a different sign-in method.",
  Verification: "That sign-in link has expired. Please request a new one.",
};

const FALLBACK_ERROR = "Something went wrong signing you in. Please try again.";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  // Already a valid operator: skip the form entirely.
  const operator = await getOperator();
  if (operator) redirect("/console");

  const { error, callbackUrl } = await searchParams;
  const message = error
    ? (ERROR_MESSAGES[error] ?? FALLBACK_ERROR)
    : null;

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="auth-eyebrow">Operator access</span>
        <h1 className="auth-title">Sign in to CivicLedger</h1>
        <p className="muted auth-subtitle">
          For city staff triaging and resolving reports. Access is limited to
          registered operator accounts.
        </p>

        {message && (
          <div className="auth-error" role="alert">
            {message}
          </div>
        )}

        <SignInForm
          devMode={process.env.NODE_ENV !== "production"}
          callbackUrl={callbackUrl ?? "/console"}
        />
      </div>

      <p className="muted auth-foot">
        Looking to report a problem instead?{" "}
        <Link href="/report">Submit a report</Link> — no account needed.
      </p>
    </div>
  );
}
