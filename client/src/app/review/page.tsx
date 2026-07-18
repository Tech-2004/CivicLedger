"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORIES } from "@civicledger/shared";

interface Item {
  id: string;
  entry_reason: "low_confidence" | "flagged_content";
  category: string | null;
  classification_confidence: number | null;
  moderation_status: string;
  status: string;
  description: string | null;
  photo_url: string | null;
  emergency_gate_fired: boolean;
  created_at: string;
}

export default function ReviewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/review");
    if (res.ok) setItems((await res.json()).items ?? []);
    else setMsg("Reviewer/admin access required.");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(reportId: string, action: Record<string, unknown>) {
    const res = await fetch(`/api/v1/review/${reportId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(action),
    });
    setMsg(res.ok ? "Action applied." : (await res.json()).error);
    if (res.ok) load();
  }

  return (
    <div>
      <h1>Manual review + moderation queue</h1>
      {msg && (
        <div className="banner" style={{ background: "var(--panel-2)" }}>
          {msg}
        </div>
      )}
      {items.length === 0 && <p className="muted">Queue is empty.</p>}

      {items.map((it) => (
        <div className="card" key={it.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="badge at_risk">{it.entry_reason}</span>
            {it.emergency_gate_fired && (
              <span className="badge overdue">emergency</span>
            )}
          </div>
          <p>{it.description ?? "(no description)"}</p>
          <p className="muted">
            category: {it.category ?? "-"} · confidence:{" "}
            {it.classification_confidence ?? "-"} · moderation:{" "}
            {it.moderation_status}
          </p>
          {it.photo_url && it.moderation_status !== "FLAGGED" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={it.photo_url}
              alt="report"
              style={{ maxWidth: 240, borderRadius: 8 }}
            />
          )}

          <ReviewActions item={it} onAct={act} />
        </div>
      ))}
    </div>
  );
}

function ReviewActions({
  item,
  onAct,
}: {
  item: Item;
  onAct: (id: string, action: Record<string, unknown>) => void;
}) {
  const [category, setCategory] = useState(item.category ?? "");
  const [mergeId, setMergeId] = useState("");

  return (
    <div className="row" style={{ marginTop: 10, alignItems: "flex-end" }}>
      <button onClick={() => onAct(item.id, { action: "approve" })}>
        Approve
      </button>

      <div>
        <label>Set category</label>
        <div className="row">
          <select
            style={{ maxWidth: 180 }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">(pick)</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            className="secondary"
            onClick={() =>
              category &&
              onAct(item.id, { action: "edit_classification", category })
            }
          >
            Save + route
          </button>
        </div>
      </div>

      <div>
        <label>Merge into case</label>
        <div className="row">
          <input
            style={{ maxWidth: 220 }}
            placeholder="target case id"
            value={mergeId}
            onChange={(e) => setMergeId(e.target.value)}
          />
          <button
            className="secondary"
            onClick={() =>
              mergeId && onAct(item.id, { action: "merge", targetCaseId: mergeId })
            }
          >
            Merge
          </button>
        </div>
      </div>

      <button
        className="secondary"
        onClick={() => onAct(item.id, { action: "reject_spam" })}
      >
        Reject spam
      </button>
      <button
        className="secondary"
        onClick={() => onAct(item.id, { action: "force_emergency" })}
      >
        Force emergency
      </button>
    </div>
  );
}
