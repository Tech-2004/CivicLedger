"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { DEV_PROVIDER_ID } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Google's mark must keep its own colours, so it is exempt from the theme. */
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
        disabled={pending !== null}
        onClick={() => {
          setPending("google");
          void signIn("google", { callbackUrl });
        }}
        className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-md border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] transition-colors hover:bg-[#f2f2f3] disabled:cursor-default disabled:opacity-65"
      >
        <GoogleMark />
        {pending === "google" ? "Redirecting..." : "Continue with Google"}
      </button>

      {devMode && (
        <>
          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            local development only
            <span className="h-px flex-1 bg-border" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPending("dev");
              void signIn(DEV_PROVIDER_ID, { email, callbackUrl });
            }}
            className="flex flex-col gap-2"
          >
            <Label htmlFor="dev-email">Any email address</Label>
            <Input
              id="dev-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.gov"
              autoComplete="off"
              required
            />
            <p className="text-[13px] text-muted-foreground">
              A seeded operator address (admin@example.gov) signs you in as
              staff. Anything else behaves like a resident.
            </p>
            <Button
              type="submit"
              variant="secondary"
              className="mt-1 w-full"
              disabled={pending !== null || email.trim() === ""}
            >
              {pending === "dev" ? "Signing in..." : "Sign in without a password"}
            </Button>
          </form>

          <p className="mt-3 text-[13px] text-muted-foreground">
            This form is not registered in production builds.
          </p>
        </>
      )}
    </>
  );
}
