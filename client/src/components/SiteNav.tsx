"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Header navigation.
 *
 * On the landing page the public links are hidden: the hero already offers
 * "Report an issue" and "View the public dashboard" as primary actions, so
 * repeating them in the header competes with them for attention. Interior pages
 * keep the full nav, since that is the only way to move between them.
 *
 * Takes booleans rather than the operator object so internal ids (jurisdiction,
 * department) are not serialised into the HTML just to render a menu. This is
 * presentation only - real enforcement is the middleware redirect,
 * requireOperator in each route handler, and RLS in the database.
 */
export function SiteNav({
  isOperator,
  canReview,
}: {
  isOperator: boolean;
  canReview: boolean;
}) {
  const isLanding = usePathname() === "/";

  return (
    <nav>
      {!isLanding && (
        <>
          <Link href="/report">Report</Link>
          <Link href="/dashboard">Dashboard</Link>
        </>
      )}
      {isOperator ? (
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
