// Auth.js (v5) configuration for the operator consoles.
//
// SECURITY NOTE: this ships a DEV-ONLY credentials provider so the skeleton is
// usable locally without an external IdP. It authorizes any seeded operator by
// email with no password and is HARD-DISABLED in production. Before going live,
// replace it with a real identity provider (OIDC/SSO) and remove this provider.
// RBAC scope (role/jurisdiction/department) is loaded from the operators table
// and flows into the RLS context on every request.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { resolveOperatorByEmail } from "@civicledger/server";
import type { OperatorIdentity } from "@civicledger/shared";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/console/sign-in" },
  providers: [
    Credentials({
      name: "Operator (dev)",
      credentials: { email: { label: "Email", type: "email" } },
      authorize: async (creds) => {
        if (process.env.NODE_ENV === "production") return null; // dev-only
        const email = String(creds?.email ?? "").toLowerCase();
        const operator = await resolveOperatorByEmail(email);
        if (!operator) return null;
        return { id: operator.operatorId, email: operator.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      if (token.email) {
        const operator = await resolveOperatorByEmail(
          String(token.email).toLowerCase(),
        );
        // Attach the resolved scope; null if the email isn't an operator.
        (token as { operator?: OperatorIdentity | null }).operator =
          operator ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      (session as { operator?: OperatorIdentity | null }).operator =
        (token as { operator?: OperatorIdentity | null }).operator ?? null;
      return session;
    },
  },
});
