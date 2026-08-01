import Link from "next/link";
import { getOperator } from "@/lib/session";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const runtime = "nodejs";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const operator = await getOperator();

  return (
    <div>
      {operator ? (
        <div className="console-bar">
          <nav className="row">
            <Link href="/console">Cases</Link>
            {(operator.role === "reviewer" || operator.role === "admin") && (
              <Link href="/review">Review queue</Link>
            )}
          </nav>
          <div className="row console-bar-identity">
            <span className="muted">{operator.email}</span>
            <span className="role-chip">{operator.role}</span>
            <SignOutButton />
          </div>
        </div>
      ) : (
        <p className="muted">
          Not signed in. <Link href="/console/sign-in">Sign in</Link>.
        </p>
      )}
      {children}
    </div>
  );
}
