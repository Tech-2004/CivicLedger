"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="secondary btn-compact"
      onClick={() => void signOut({ callbackUrl: "/" })}
    >
      Sign out
    </button>
  );
}
