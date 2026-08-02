import { auth } from "@/auth";
import type { SessionWithOperator } from "@/auth.config";
import { ShellChrome } from "./ShellChrome";

/**
 * The single application frame: a thin top bar for brand and session, plus a
 * collapsible navigation sidebar.
 *
 * Session state is resolved here, in a server component, and passed down as
 * plain props - only what the chrome renders, not the operator object, so
 * internal jurisdiction/department ids never reach the HTML.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = (await auth()) as SessionWithOperator | null;
  const operator = session?.operator ?? null;

  return (
    <ShellChrome
      isSignedIn={session !== null}
      isOperator={operator !== null}
      canReview={operator?.role === "reviewer" || operator?.role === "admin"}
      email={session?.user?.email ?? operator?.email ?? null}
      role={operator?.role ?? null}
    >
      {children}
    </ShellChrome>
  );
}
