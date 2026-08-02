// Edge-safe Auth.js configuration.
//
// Middleware runs on the Edge runtime, where the pg driver cannot load. The full
// config in auth.ts imports @civicledger/server (and therefore pg) because its
// callbacks query the operators table, so it must never be imported from
// middleware or from a client component.
//
// This module holds only what is safe in both runtimes: session strategy, page
// routes, shared constants, and a session callback that reads an already-issued
// claim without touching the database. auth.ts spreads it and layers the
// providers and database-backed callbacks on top.

import type { NextAuthConfig, Session } from "next-auth";
import type { OperatorIdentity } from "@civicledger/shared";

/** Provider id for the local-only passwordless sign-in. */
export const DEV_PROVIDER_ID = "dev";

/** Where people are sent to authenticate. */
export const SIGN_IN_PATH = "/console/sign-in";

/**
 * Two tiers of access:
 *
 *   signed in            any authenticated account. Enough to file a report.
 *   signed in + operator present in the `operators` table. Required for the
 *                        department and review consoles.
 *
 * A citizen therefore holds a valid session with `operator === null`.
 */
export type SessionWithOperator = Session & {
  operator?: OperatorIdentity | null;
};

type TokenWithOperator = { operator?: OperatorIdentity | null };

/**
 * Shared base config. `providers` is intentionally empty: verifying an existing
 * session JWT needs AUTH_SECRET only, not a provider.
 *
 * The session callback surfaces the `operator` claim that auth.ts's jwt callback
 * wrote when the token was issued. Reading it here is a pure claim lookup with
 * no database access, which is what lets middleware distinguish an operator from
 * a citizen on the Edge runtime.
 */
export const baseAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  // Errors land back on the sign-in page so they can be shown in context.
  pages: { signIn: SIGN_IN_PATH, error: SIGN_IN_PATH },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      (session as SessionWithOperator).operator =
        (token as TokenWithOperator).operator ?? null;
      return session;
    },
  },
};
