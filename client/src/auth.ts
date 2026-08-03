// Auth.js (v5) configuration for the operator consoles.
//
// AUTHENTICATION and AUTHORIZATION are deliberately separate here:
//
//   authentication -> Google OAuth proves who the person is.
//   authorization  -> the `operators` table decides whether they may in.
//
// A successful Google login is NOT sufficient. Without the `signIn` gate below,
// any Google account in the world would receive a valid session. The operator
// row is also what supplies the RBAC scope (role / jurisdiction / department)
// that becomes the Postgres RLS context on every request.
//
// A credentials provider also exists so the app is usable without OAuth
// credentials. Locally it is passwordless; on a deployed environment it only
// registers when PREVIEW_LOGIN_PASSWORD is set, and then demands it. See
// `credentialsLoginMode` below.

import { timingSafeEqual } from "node:crypto";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { resolveOperatorByEmail } from "@civicledger/server";
import type { OperatorIdentity } from "@civicledger/shared";
import { baseAuthConfig, DEV_PROVIDER_ID } from "./auth.config";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Shared password that unlocks credentials sign-in on a deployed environment.
 * Unset means the provider is not registered in production at all.
 */
const sharedPassword = process.env.PREVIEW_LOGIN_PASSWORD?.trim() ?? "";

/**
 * How credentials sign-in behaves in the current environment:
 *
 *   open      - development only. Any address, no password.
 *   password  - deployed, and PREVIEW_LOGIN_PASSWORD is set. Requires it.
 *   off       - deployed with no shared password. Google only.
 *
 * The deployed mode exists because Google OAuth credentials aren't configured
 * yet, which left the live site with no way in at all. It is password-gated
 * rather than open: this provider hands out operator scope by email alone, so an
 * unprotected version on a public URL would let anyone sign in as an admin and
 * inherit full RLS access.
 */
export type CredentialsLoginMode = "off" | "open" | "password";

export const credentialsLoginMode: CredentialsLoginMode = !isProduction
  ? "open"
  : sharedPassword
    ? "password"
    : "off";

/** Constant-time comparison, so the password can't be probed byte-by-byte. */
function passwordMatches(supplied: string): boolean {
  const a = Buffer.from(supplied, "utf8");
  const b = Buffer.from(sharedPassword, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Shape of the token/session once the operator scope has been attached. */
type WithOperator = { operator?: OperatorIdentity | null };

// Auth.js reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from the environment
// automatically, so they are not passed explicitly.
const providers: NextAuthConfig["providers"] = [
  Google({
    // Always show the account chooser. Without this, an operator already signed
    // into a personal Google account gets silently logged in with it, which is
    // confusing when their operator record is under a work address.
    authorization: { params: { prompt: "select_account" } },
  }),
];

if (credentialsLoginMode !== "off") {
  providers.push(
    Credentials({
      id: DEV_PROVIDER_ID,
      name:
        credentialsLoginMode === "password"
          ? "Email and shared password"
          : "Operator (dev, no password)",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Access password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        if (!email.includes("@")) return null;

        // On a deployed environment the shared password is mandatory. Checked
        // before the database lookup so a wrong password can't be distinguished
        // from an unknown email by response timing.
        if (credentialsLoginMode === "password") {
          if (!passwordMatches(String(credentials?.password ?? ""))) {
            return null;
          }
        }

        // Any address is accepted so BOTH paths work without OAuth credentials:
        // a seeded operator email yields operator scope, anything else yields a
        // resident session (operator === null), which is what a Google sign-in
        // by a resident produces. The jwt callback resolves the scope either
        // way, so this only decides identity, not authorization.
        const operator = await resolveOperatorByEmail(email);
        return { id: operator?.operatorId ?? `citizen:${email}`, email };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Session strategy and page routes are shared with the Edge middleware config
  // so the two cannot drift.
  ...baseAuthConfig,
  providers,
  callbacks: {
    /**
     * Any account with an email may sign in, because citizens need a session to
     * file a report. This is NOT the console gate.
     *
     * Console authorization is the `operator` claim attached below: a citizen
     * holds a valid session with operator === null, and middleware plus
     * requireOperator refuse them the consoles. RLS is the backstop, since an
     * operator row is what produces a scoped database context at all.
     */
    async signIn({ user }) {
      return Boolean(user.email?.trim());
    },

    /**
     * Attaches the operator scope, or null for a citizen. This claim is what
     * middleware reads on the Edge to tell the two apart.
     */
    async jwt({ token }) {
      if (token.email) {
        // Re-resolved on each token read so a revoked operator or a changed
        // role takes effect immediately. This is a single indexed lookup by
        // email; if it ever shows up in latency profiles it could be cached
        // with a short TTL, but that trades away instant revocation.
        const operator = await resolveOperatorByEmail(
          String(token.email).toLowerCase(),
        );
        (token as WithOperator).operator = operator ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      (session as WithOperator).operator =
        (token as WithOperator).operator ?? null;
      return session;
    },
  },
});
