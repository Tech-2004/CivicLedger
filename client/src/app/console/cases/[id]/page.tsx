"use client";

import { use, useCallback, useEffect, useState } from "react";
import { RESOLUTION_REASON_CODES } from "@civicledger/shared";
import { PageHeader } from "@/components/shell/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
    else setMsg("Could not load case (permission denied, or it doesn't exist).");
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

  if (!detail) {
    return (
      <p className="text-sm text-muted-foreground">{msg ?? "Loading…"}</p>
    );
  }

  const c = detail.case;

  return (
    <>
      <PageHeader title={`${String(c.category)} case`} />

      {msg && (
        <Alert variant="notice" className="mb-4">
          {msg}
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="p-5 pt-5">
          <p className="text-sm">
            <span className="text-muted-foreground">Status: </span>
            <span className="font-medium">{String(c.status)}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setStatus("IN_PROGRESS")}
            >
              Mark in progress
            </Button>
            <Button variant="secondary" onClick={() => setStatus("OPEN")}>
              Reopen
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-base font-semibold">
        Reports ({detail.reports.length})
      </h2>
      <div className="mb-6 flex flex-col gap-3">
        {detail.reports.map((r) => (
          <Card key={String(r.id)}>
            <CardContent className="p-4 pt-4">
              <div className="flex flex-col-reverse items-start justify-between gap-1.5 sm:flex-row sm:gap-3">
                <span className="min-w-0 break-words text-sm">
                  {String(r.description ?? "(no description)")}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {String(r.source_channel)}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                moderation: {String(r.moderation_status)} · routing:{" "}
                {String(r.routing_path ?? "—")} · confidence:{" "}
                {String(r.classification_confidence ?? "—")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <NoteForm onAdd={addNote} />
      <ResolveForm onResolve={resolve} />

      <h2 className="mb-3 text-base font-semibold">Audit timeline</h2>
      <Card>
        <CardContent className="flex flex-col gap-1.5 p-5 pt-5">
          {detail.events.map((e, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              {new Date(String(e.created_at)).toLocaleString()} —{" "}
              {String(e.event_type)}
            </p>
          ))}
        </CardContent>
      </Card>
    </>
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
    <Card className="mb-4">
      <CardContent className="p-5 pt-5">
        <h2 className="mb-3 text-base font-semibold">Add note</h2>
        <Textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Internal by default."
        />
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Public update (visible on the dashboard)</span>
        </label>
        <Button
          className="mt-4"
          disabled={!body.trim()}
          onClick={() => {
            if (body.trim()) onAdd(body, isPublic);
            setBody("");
          }}
        >
          Add note
        </Button>
      </CardContent>
    </Card>
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

  const canResolve = Boolean(proofPhotoUrl || reasonCode);

  return (
    <Card className="mb-6">
      <CardContent className="p-5 pt-5">
        <h2 className="text-base font-semibold">Resolve</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Requires a proof photo or a reason code.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="res-type">Resolution type</Label>
            <Select
              id="res-type"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="RESOLVED">Resolved</option>
              <option value="WONT_FIX">Won&apos;t fix</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="res-reason">Reason code</Label>
            <Select
              id="res-reason"
              value={reasonCode}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">(none)</option>
              {RESOLUTION_REASON_CODES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="res-proof">Proof photo URL</Label>
            <Input
              id="res-proof"
              value={proofPhotoUrl}
              onChange={(e) => setProof(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="res-note">Public note (optional)</Label>
            <Input
              id="res-note"
              value={publicNote}
              onChange={(e) => setPublicNote(e.target.value)}
            />
          </div>
        </div>

        <Button
          className="mt-4"
          disabled={!canResolve}
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
        </Button>
      </CardContent>
    </Card>
  );
}
