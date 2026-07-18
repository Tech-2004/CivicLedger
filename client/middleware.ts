// Gate the operator consoles behind authentication. Fine-grained RBAC (role +
// jurisdiction/department scope) is enforced in each route handler + at the DB
// via RLS; this middleware only blocks anonymous access to console UI/APIs.
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isConsole =
    req.nextUrl.pathname.startsWith("/console") ||
    req.nextUrl.pathname.startsWith("/review") ||
    req.nextUrl.pathname.startsWith("/api/v1/console") ||
    req.nextUrl.pathname.startsWith("/api/v1/review");

  const isSignIn = req.nextUrl.pathname === "/console/sign-in";

  if (isConsole && !isSignIn && !req.auth) {
    const url = new URL("/console/sign-in", req.nextUrl.origin);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/console/:path*", "/review/:path*", "/api/v1/console/:path*", "/api/v1/review/:path*"],
};
