// Coarse authentication gate for the operator surfaces.
//
// LOCATION MATTERS: this file must sit beside the `app` directory, which means
// inside `src/` for this project. It previously lived at the package root, where
// Next.js silently ignored it - so this gate never ran at all. The consoles were
// still protected (each page redirects and each route handler calls
// requireOperator, with RLS behind both), but this layer was dead code.
//
// It uses the Edge-safe config deliberately: the full auth.ts pulls in the pg
// driver via its operator lookup, which cannot load on the Edge runtime.
//
// Scope: block anonymous traffic only. Role-level authorization stays in the
// route handlers and in the database policies.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { baseAuthConfig, SIGN_IN_PATH } from "@/auth.config";

const { auth } = NextAuth(baseAuthConfig);

const UI_PREFIXES = ["/console", "/review"];
const API_PREFIXES = ["/api/v1/console", "/api/v1/review"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // The sign-in page itself must stay reachable while unauthenticated.
  if (pathname === SIGN_IN_PATH) return NextResponse.next();

  const isApi = API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isUi = UI_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isApi && !isUi) return NextResponse.next();
  if (req.auth) return NextResponse.next();

  // API callers get a status code they can handle. Redirecting them to an HTML
  // page would surface as a confusing JSON parse error in the client.
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Preserve where they were heading so sign-in can return them there.
  const url = new URL(SIGN_IN_PATH, req.nextUrl.origin);
  url.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: [
    "/console/:path*",
    "/review/:path*",
    "/api/v1/console/:path*",
    "/api/v1/review/:path*",
  ],
};
