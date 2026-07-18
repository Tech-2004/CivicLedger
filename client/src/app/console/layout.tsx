import Link from "next/link";
import { getOperator } from "@/lib/session";

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
        <div
          className="row"
          style={{ marginBottom: 16, justifyContent: "space-between" }}
        >
          <div className="row">
            <Link href="/console">Cases</Link>
            {(operator.role === "reviewer" || operator.role === "admin") && (
              <Link href="/review">Review queue</Link>
            )}
          </div>
          <span className="muted">
            {operator.email} ({operator.role})
          </span>
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
