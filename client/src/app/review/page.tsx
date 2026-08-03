"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORIES } from "@civicledger/shared";
import { PageContainer } from "@/components/shell/PageContainer";
import { PageHeader } from "@/components/shell/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
    else setMsg("Reviewer or admin access required.");
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
    <PageContainer>
      <PageHeader
        title="Manual review + moderation"
        description="Two things land here: reports the classifier wasn't confident about, and content flagged by moderation."
      />

      {msg && (
        <Alert variant="notice" className="mb-4">
          {msg}
        </Alert>
      )}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Queue is empty.</p>
      )}

      <div className="flex flex-col gap-4">
        {items.map((it) => (
          <Card key={it.id}>
            <CardContent className="p-5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <Badge
                  variant={
                    it.entry_reason === "flagged_content" ? "purple" : "atRisk"
                  }
                  dot
                >
                  {it.entry_reason.replace("_", " ")}
                </Badge>
                {it.emergency_gate_fired && (
                  <Badge variant="overdue" dot>
                    emergency
                  </Badge>
                )}
              </div>

              <p className="mt-3 text-sm">
                {it.description ?? "(no description)"}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                category: {it.category ?? "—"} · confidence:{" "}
                {it.classification_confidence ?? "—"} · moderation:{" "}
                {it.moderation_status}
              </p>

              {it.photo_url && it.moderation_status !== "FLAGGED" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.photo_url}
                  alt="report"
                  className="mt-3 max-w-[240px] rounded-lg border border-border"
                />
              )}

              <ReviewActions item={it} onAct={act} />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
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
    <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onAct(item.id, { action: "approve" })}>
          Approve
        </Button>
        <Button
          variant="secondary"
          onClick={() => onAct(item.id, { action: "reject_spam" })}
        >
          Reject spam
        </Button>
        <Button
          variant="secondary"
          onClick={() => onAct(item.id, { action: "force_emergency" })}
        >
          Force emergency
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`cat-${item.id}`}>Set category</Label>
          <div className="flex gap-2">
            <Select
              id={`cat-${item.id}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">(pick)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              disabled={!category}
              onClick={() =>
                category &&
                onAct(item.id, { action: "edit_classification", category })
              }
            >
              Save
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`merge-${item.id}`}>Merge into case</Label>
          <div className="flex gap-2">
            <Input
              id={`merge-${item.id}`}
              placeholder="target case id"
              value={mergeId}
              onChange={(e) => setMergeId(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={!mergeId}
              onClick={() =>
                mergeId &&
                onAct(item.id, { action: "merge", targetCaseId: mergeId })
              }
            >
              Merge
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
