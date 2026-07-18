"use client";

import { use, useCallback, useEffect, useState } from "react";
import { RESOLUTION_REASON_CODES } from "@civicledger/shared";

interface Detail {
  case: Record<string, unknown>;
  reports: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
}

export default function ConsoleCaseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/console/cases/${id}`);
    if (res.ok) setDetail(await res.json());
    else setMsg("Could not load case (permission or not found).");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(status: string) {
    const res = await fetch(`/api/v1/console/cases/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMsg(res.ok ? "Status updated." : (await res.json()).error);
    if (res.ok) load();
  }

  async function addNote(body: string, isPublic: boolean) {
    const res = await fetch(`/api/v1/console/cases/${id}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, isPublic }),
    });
    setMsg(res.ok ? "Note added." : "Failed to add note.");
    if (res.ok) load();
  }

  async function resolve(payload: Record<string, unknown>) {
    const res = await fetch(`/api/v1/console/cases/${id}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMsg(res.ok ? "Case resolved." : (await res.json()).error);
    if (res.ok) load();
  }

  if (!detail) return <p className="muted">{msg ?? "Loading..."}</p>;
  const c = detail.case;

  return (
    <div>
      <h1 style={{ textTransform: "capitalize" }}>
        {String(c.category)} case
      </h1>
      {msg && <div className="banner" style={{ background: "var(--panel-2)" }}>{msg}</div>}

      <div className="card">
        <p>
          <strong>Status:</strong> {String(c.status)}
        </p>
        <div className="row">
          <button className="secondary" onClick={() => setStatus("IN_PROGRESS")}>
            Mark in progress
          </button>
          <button className="secondary" onClick={() => setStatus("OPEN")}>
            Reopen
          </button>
        </div>
      </div>

      <h2>Reports ({detail.reports.length})</h2>
      {detail.reports.map((r) => (
        <div className="card" key={String(r.id)}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>{String(r.description ?? "(no description)")}</span>
            <span className="muted">{String(r.source_channel)}</span>
          </div>
          <p className="muted">
            moderation: {String(r.moderation_status)} · routing:{" "}
            {String(r.routing_path ?? "-")} · confidence:{" "}
            {String(r.classification_confidence ?? "-")}
          </p>
        </div>
      ))}

      <NoteForm onAdd={addNote} />
      <ResolveForm onResolve={resolve} />

      <h2>Audit timeline</h2>
      <div className="card">
        {detail.events.map((e, i) => (
          <p key={i} className="muted">
            {new Date(String(e.created_at)).toLocaleString()} —{" "}
            {String(e.event_type)}
          </p>
        ))}
      </div>
    </div>
  );
}

function NoteForm({
  onAdd,
}: {
  onAdd: (body: string, isPublic: boolean) => void;
}) {
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Add note</h2>
      <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
      <label className="row" style={{ marginTop: 8 }}>
        <input
          type="checkbox"
          style={{ width: "auto" }}
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        <span>Public update (visible on the dashboard)</span>
      </label>
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => {
            if (body.trim()) onAdd(body, isPublic);
            setBody("");
          }}
        >
          Add note
        </button>
      </div>
    </div>
  );
}

function ResolveForm({
  onResolve,
}: {
  onResolve: (payload: Record<string, unknown>) => void;
}) {
  const [proofPhotoUrl, setProof] = useState("");
  const [reasonCode, setReason] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [status, setStatus] = useState("RESOLVED");

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Resolve</h2>
      <p className="muted">
        Requires a proof photo OR a reason code (not proof-only).
      </p>
      <label>Resolution type</label>
      <select
        style={{ maxWidth: 220 }}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="RESOLVED">Resolved</option>
        <option value="WONT_FIX">Won&apos;t fix</option>
      </select>
      <label>Proof photo URL</label>
      <input value={proofPhotoUrl} onChange={(e) => setProof(e.target.value)} />
      <label>Reason code</label>
      <select value={reasonCode} onChange={(e) => setReason(e.target.value)}>
        <option value="">(none)</option>
        {RESOLUTION_REASON_CODES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <label>Public note (optional)</label>
      <input value={publicNote} onChange={(e) => setPublicNote(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <button
          onClick={() =>
            onResolve({
              status,
              proofPhotoUrl: proofPhotoUrl || undefined,
              reasonCode: reasonCode || undefined,
              publicNote: publicNote || undefined,
            })
          }
        >
          Resolve case
        </button>
      </div>
    </div>
  );
}
