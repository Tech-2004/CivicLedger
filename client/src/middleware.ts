// Authentication gate.
//
// LOCATION MATTERS: this file must sit beside the `app` directory, which means
// inside `src/` for this project. It previously lived at the package root, where
// Next.js silently ignored it, so the gate never ran.
//
// It uses the Edge-safe config deliberately: the full auth.ts pulls in the pg
// driver via its operator lookup, which cannot load on the Edge runtime.
//
// Two tiers:
//
//   CITIZEN   any signed-in account. Required to file a report.
//   OPERATOR  signed in AND present in the `operators` table. Required for the
//             department and review consoles.
//
// A citizen holds a valid session with operator === null, so checking only for a
// session would let one walk into the consoles. That is why the operator tiers
// test the claim, not just presence of auth.
//
// Role-level authorization (department vs reviewer vs admin) stays in the route
// handlers via requireOperator, with RLS behind it.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import {
  baseAuthConfig,
  SIGN_IN_PATH,
  type SessionWithOperator,
} from "@/auth.config";

const { auth } = NextAuth(baseAuthConfig);

/** Operator-only: pages. */
const OPERATOR_UI = ["/console", "/review"];
/** Operator-only: JSON endpoints. */
const OPERATOR_API = ["/api/v1/console", "/api/v1/review"];
/** Any signed-in account: pages. */
const CITIZEN_UI = ["/report"];
/**
 * Any signed-in account: JSON endpoints backing the report flow. Gating the page
 * without gating these would leave the requirement cosmetic, since the endpoints
 * could still be posted to directly.
 *
 * Deliberately excluded:
 *   /api/v1/reports/sms  Twilio webhook - it authenticates by request signature,
 *                        and a redirect would break the carrier callback.
 *   /api/v1/reports/[id] public status tracking, used by /track/[id].
 *   /api/v1/public/*     the public dashboard.
 */
const CITIZEN_API = ["/api/v1/upload"];

function isUnder(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // The sign-in page must stay reachable while unauthenticated.
  if (pathname === SIGN_IN_PATH) return NextResponse.next();

  // POST /api/v1/reports is a citizen write; other methods on that path (and its
  // /[id] children) stay public for status tracking.
  const isReportSubmit = pathname === "/api/v1/reports" && req.method === "POST";

  const needsOperator =
    isUnder(pathname, OPERATOR_UI) || isUnder(pathname, OPERATOR_API);
  const needsSession =
    isUnder(pathname, CITIZEN_UI) ||
    isUnder(pathname, CITIZEN_API) ||
    isReportSubmit;

  if (!needsOperator && !needsSession) return NextResponse.next();

  const isApi =
    isUnder(pathname, OPERATOR_API) ||
    isUnder(pathname, CITIZEN_API) ||
    isReportSubmit;

  const session = req.auth as SessionWithOperator | null;

  // Not signed in at all.
  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(SIGN_IN_PATH, req.nextUrl.origin);
    // Return them where they were heading once they authenticate.
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in, but a citizen reaching for an operator surface.
  if (needsOperator && !session.operator) {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = new URL(SIGN_IN_PATH, req.nextUrl.origin);
    url.searchParams.set("error", "NotAnOperator");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/console/:path*",
    "/review/:path*",
    "/report/:path*",
    "/api/v1/console/:path*",
    "/api/v1/review/:path*",
    "/api/v1/upload/:path*",
    "/api/v1/reports",
  ],
};
