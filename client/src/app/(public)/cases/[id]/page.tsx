import { getPublicCase } from "@civicledger/server";
import { notFound } from "next/navigation";

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
    <div>
      <h1 style={{ textTransform: "capitalize" }}>{c.category} case</h1>
      <div className="row">
        <span className={`badge ${c.slaBadge}`}>{c.slaBadge}</span>
        <span className="muted">Status: {c.status}</span>
        <span className="muted">{c.reportCount} report(s)</span>
      </div>

      {detail.media.length > 0 && (
        <>
          <h2>Photos</h2>
          <div className="grid">
            {detail.media.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.report_id}
                src={m.photo_url}
                alt="reported issue"
                style={{ width: "100%", borderRadius: 8 }}
              />
            ))}
          </div>
        </>
      )}

      <h2>Timeline</h2>
      <div className="card">
        <p className="muted">
          Opened {new Date(c.createdAt).toLocaleString()}
        </p>
        {detail.publicNotes.map((n, i) => (
          <p key={i}>
            <span className="muted">
              {new Date(n.created_at).toLocaleString()}:
            </span>{" "}
            {n.body}
          </p>
        ))}
        {c.resolvedAt && (
          <p className="muted">
            Resolved {new Date(c.resolvedAt).toLocaleString()}
          </p>
        )}
        {detail.publicNotes.length === 0 && !c.resolvedAt && (
          <p className="muted">No public updates yet.</p>
        )}
      </div>
    </div>
  );
}
