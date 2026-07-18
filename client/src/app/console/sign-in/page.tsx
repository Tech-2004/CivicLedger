"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await signIn("credentials", { email, callbackUrl: "/console" });
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>Operator sign-in</h1>
      <p className="muted">
        Dev sign-in. Use a seeded operator email (e.g. admin@example.gov).
        Replace with your real identity provider before production.
      </p>
      <form onSubmit={submit} className="card">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operator@example.gov"
          required
        />
        <div style={{ marginTop: 16 }}>
          <button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </div>
      </form>
    </div>
  );
}
