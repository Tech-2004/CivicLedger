import Link from "next/link";
import { redirect } from "next/navigation";
import { getOperator } from "@/lib/session";
import { listCases } from "@civicledger/server";
import type { CaseStatus, Category } from "@civicledger/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConsoleCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; overdue?: string }>;
}) {
  const operator = await getOperator();
  if (!operator) redirect("/console/sign-in");

  const sp = await searchParams;
  const cases = await listCases(operator, {
    status: (sp.status as CaseStatus) || undefined,
    category: (sp.category as Category) || undefined,
    overdue: sp.overdue === "true",
  });

  return (
    <div>
      <h1>Assigned cases</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <Link className="badge resolved" href="/console">
          All
        </Link>
        <Link className="badge overdue" href="/console?overdue=true">
          Overdue
        </Link>
        <Link className="badge on_track" href="/console?status=OPEN">
          Open
        </Link>
        <Link className="badge at_risk" href="/console?status=IN_PROGRESS">
          In progress
        </Link>
      </div>

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Status</th>
            <th>Reports</th>
            <th>SLA</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/console/cases/${c.id}`}>{c.category}</Link>
              </td>
              <td>{c.status}</td>
              <td>{c.report_count}</td>
              <td>
                <span className={`badge ${c.slaBadge}`}>{c.slaBadge}</span>
              </td>
              <td className="muted">
                {c.sla_deadline
                  ? new Date(c.sla_deadline).toLocaleString()
                  : "-"}
              </td>
            </tr>
          ))}
          {cases.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No cases in your scope.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
