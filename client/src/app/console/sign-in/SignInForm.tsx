"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { DEV_PROVIDER_ID } from "@/auth.config";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.1l3.01-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function SignInForm({
  devMode,
  callbackUrl,
}: {
  devMode: boolean;
  callbackUrl: string;
}) {
  const [pending, setPending] = useState<"google" | "dev" | null>(null);
  const [email, setEmail] = useState("");

  return (
    <>
      <button
        className="btn-google"
        disabled={pending !== null}
        onClick={() => {
          setPending("google");
          void signIn("google", { callbackUrl });
        }}
      >
        <GoogleMark />
        {pending === "google" ? "Redirecting..." : "Continue with Google"}
      </button>

      {devMode && (
        <>
          <div className="auth-divider">
            <span>local development only</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPending("dev");
              void signIn(DEV_PROVIDER_ID, { email, callbackUrl });
            }}
          >
            <label htmlFor="dev-email">Any email address</label>
            <input
              id="dev-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.gov"
              autoComplete="off"
              required
            />
            <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
              A seeded operator address (admin@example.gov) signs you in as
              staff. Anything else behaves like a resident.
            </p>
            <button
              className="secondary"
              style={{ marginTop: 12, width: "100%" }}
              disabled={pending !== null || email.trim() === ""}
            >
              {pending === "dev" ? "Signing in..." : "Sign in without a password"}
            </button>
          </form>
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
            This form is not registered in production builds.
          </p>
        </>
      )}
    </>
  );
}
