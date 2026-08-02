import { auth } from "@/auth";
import type { SessionWithOperator } from "@/auth.config";
import { TopBar } from "./TopBar";

/**
 * The single application frame: one top bar, then the page.
 *
 * Navigation is horizontal rather than a left rail because the dashboard needs
 * that left column for its own filters - two stacked sidebars competed with each
 * other. Every route now shares this chrome.
 *
 * Session state is resolved here, in a server component, and passed down as
 * plain props - only what the navigation renders, not the operator object, so
 * internal jurisdiction/department ids never reach the HTML.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = (await auth()) as SessionWithOperator | null;
  const operator = session?.operator ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        isSignedIn={session !== null}
        isOperator={operator !== null}
        canReview={operator?.role === "reviewer" || operator?.role === "admin"}
        email={session?.user?.email ?? operator?.email ?? null}
      />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
