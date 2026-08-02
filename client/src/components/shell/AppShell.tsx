import { auth } from "@/auth";
import type { SessionWithOperator } from "@/auth.config";
import { Sidebar } from "./Sidebar";

/**
 * The single application frame.
 *
 * Everything used to carry its own chrome: most pages had a top toolbar while
 * the dashboard shipped a bespoke header and sidebar, so moving between them
 * felt like two different products. One shell now wraps every route.
 *
 * Session state is resolved here, in a server component, and passed down as
 * plain props - only what the navigation renders, not the operator object, so
 * internal jurisdiction/department ids never reach the HTML.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = (await auth()) as SessionWithOperator | null;
  const operator = session?.operator ?? null;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        isSignedIn={session !== null}
        isOperator={operator !== null}
        canReview={operator?.role === "reviewer" || operator?.role === "admin"}
        email={session?.user?.email ?? operator?.email ?? null}
        role={operator?.role ?? null}
      />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
