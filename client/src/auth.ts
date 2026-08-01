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
// A passwordless credentials provider is registered OUTSIDE production only, so
// the app stays usable locally without OAuth credentials. It is never
// registered in a production build.

import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { resolveOperatorByEmail } from "@civicledger/server";
import type { OperatorIdentity } from "@civicledger/shared";
import { baseAuthConfig, DEV_PROVIDER_ID } from "./auth.config";

const isProduction = process.env.NODE_ENV === "production";

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

if (!isProduction) {
  providers.push(
    Credentials({
      id: DEV_PROVIDER_ID,
      name: "Operator (dev, no password)",
      credentials: { email: { label: "Email", type: "email" } },
      authorize: async (credentials) => {
        // Redundant with the conditional registration above, kept so this
        // provider can never authenticate anyone in production even if the
        // registration logic is changed later.
        if (isProduction) return null;

        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        if (!email) return null;

        const operator = await resolveOperatorByEmail(email);
        if (!operator) return null;

        return { id: operator.operatorId, email: operator.email };
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
     * The authorization gate. Returning false aborts the sign-in and redirects
     * back to the sign-in page with `error=AccessDenied`.
     */
    async signIn({ user }) {
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;
      return Boolean(await resolveOperatorByEmail(email));
    },

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
