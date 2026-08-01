// Edge-safe Auth.js configuration.
//
// Middleware runs on the Edge runtime, where the pg driver cannot load. The full
// config in auth.ts imports @civicledger/server (and therefore pg) because its
// callbacks query the operators table, so it must never be imported from
// middleware or from a client component.
//
// This module holds only what is safe in both runtimes: session strategy, page
// routes, and shared constants. auth.ts spreads it and adds the providers and
// database-backed callbacks on top, so the two cannot drift apart.

import type { NextAuthConfig } from "next-auth";

/** Provider id for the local-only passwordless sign-in. */
export const DEV_PROVIDER_ID = "dev";

/** Where operators are sent to authenticate. */
export const SIGN_IN_PATH = "/console/sign-in";

/**
 * Shared base config. `providers` is intentionally empty: verifying an existing
 * session JWT needs AUTH_SECRET only, not a provider, which is all middleware
 * has to do.
 */
export const baseAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  // Errors land back on the sign-in page so they can be shown in context.
  pages: { signIn: SIGN_IN_PATH, error: SIGN_IN_PATH },
  providers: [],
};
