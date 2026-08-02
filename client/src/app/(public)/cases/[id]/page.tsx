import { getPublicCase } from "@civicledger/server";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/shell/PageContainer";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge, slaBadgeVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PublicCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPublicCase(id);
  if (!detail) notFound();

  const c = detail.case;

  return (
    <PageContainer>
      <PageHeader title={`${c.category} case`} />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Badge variant={slaBadgeVariant[c.slaBadge]}>
          {c.slaBadge.replace("_", " ")}
        </Badge>
        <span className="text-muted-foreground">Status: {c.status}</span>
        <span className="text-muted-foreground">
          {c.reportCount} report{c.reportCount === 1 ? "" : "s"}
        </span>
      </div>

      {detail.media.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold">Photos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {detail.media.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.report_id}
                src={m.photo_url}
                alt="reported issue"
                className="w-full rounded-lg border border-border"
              />
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-3 text-base font-semibold">Timeline</h2>
      <Card>
        <CardContent className="flex flex-col gap-2 p-5 pt-5 text-sm">
          <p className="text-muted-foreground">
            Opened {new Date(c.createdAt).toLocaleString()}
          </p>
          {detail.publicNotes.map((n, i) => (
            <p key={i}>
              <span className="text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}:
              </span>{" "}
              {n.body}
            </p>
          ))}
          {c.resolvedAt && (
            <p className="text-muted-foreground">
              Resolved {new Date(c.resolvedAt).toLocaleString()}
            </p>
          )}
          {detail.publicNotes.length === 0 && !c.resolvedAt && (
            <p className="text-muted-foreground">No public updates yet.</p>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
