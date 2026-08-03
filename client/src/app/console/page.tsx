import Link from "next/link";
import { redirect } from "next/navigation";
import { getOperator } from "@/lib/session";
import { listCases } from "@civicledger/server";
import type { CaseStatus, Category } from "@civicledger/shared";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge, slaBadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILTERS = [
  { label: "All", href: "/console" },
  { label: "Overdue", href: "/console?overdue=true" },
  { label: "Open", href: "/console?status=OPEN" },
  { label: "In progress", href: "/console?status=IN_PROGRESS" },
];

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

  // Mirrors how the current filter is expressed in the URL, so the active pill
  // matches what the query actually did.
  const current = sp.overdue === "true" ? "Overdue" : statusLabel(sp.status);

  return (
    <>
      <PageHeader
        title="Assigned cases"
        description={`${cases.length} case${cases.length === 1 ? "" : "s"} in your scope.`}
      />

      {/* Segmented control rather than loose pills: these are mutually exclusive
          views of one list, and a single grouped surface says that. */}
      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-secondary/40 p-1">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            aria-current={current === f.label ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
              current === f.label
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="capitalize">
                  <Link
                    href={`/console/cases/${c.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {c.category}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.status}
                </TableCell>
                <TableCell className="tabular">{c.report_count}</TableCell>
                <TableCell>
                  <Badge variant={slaBadgeVariant[c.slaBadge]} dot>
                    {c.slaBadge.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.sla_deadline
                    ? new Date(c.sla_deadline).toLocaleString()
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
            {cases.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No cases in your scope.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function statusLabel(status?: string) {
  if (status === "OPEN") return "Open";
  if (status === "IN_PROGRESS") return "In progress";
  return "All";
}
