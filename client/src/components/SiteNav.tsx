import Link from "next/link";
import { getOperator } from "@/lib/session";

/**
 * Header navigation. Operator-only destinations are hidden from the public, and
 * the review queue only appears for the roles that can use it.
 *
 * This is presentation only - the real enforcement is the middleware redirect
 * plus `requireOperator` in each route handler and RLS in the database.
 */
export async function SiteNav() {
  const operator = await getOperator();
  const canReview = operator?.role === "reviewer" || operator?.role === "admin";

  return (
    <nav>
      <Link href="/report">Report</Link>
      <Link href="/dashboard">Dashboard</Link>
      {operator ? (
        <>
          <Link href="/console">Console</Link>
          {canReview && <Link href="/review">Review</Link>}
        </>
      ) : (
        <Link href="/console/sign-in">Staff sign-in</Link>
      )}
    </nav>
  );
}
