"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { PageContainer } from "@/components/shell/PageContainer";
import { PageHeader } from "@/components/shell/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DRAFT_KEY = "civicledger:draft";

interface DraftShape {
  description: string;
  contact: string;
  lat: string;
  lng: string;
  addressText: string;
  photoUrl?: string;
  idempotencyKey: string;
}

type Result =
  | { kind: "received"; trackingUrl: string; reportId: string }
  | {
      kind: "emergency";
      emergencyNumber: string;
      message: string;
      trackingUrl: string;
    };

export default function ReportPage() {
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [addressText, setAddressText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [online, setOnline] = useState(true);

  // Restore an offline draft if present.
  useEffect(() => {
    setOnline(navigator.onLine);
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw) as DraftShape;
        setDescription(d.description ?? "");
        setContact(d.contact ?? "");
        setLat(d.lat ?? "");
        setLng(d.lng ?? "");
        setAddressText(d.addressText ?? "");
        setPhotoUrl(d.photoUrl);
      } catch {
        /* ignore malformed draft */
      }
    }
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      () => setError("Could not get your location. Enter it manually."),
    );
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/v1/upload",
      });
      setPhotoUrl(blob.url);
    } catch {
      setError("Photo upload failed. You can still submit without a photo.");
    } finally {
      setBusy(false);
    }
  }

  function saveDraft() {
    const draft: DraftShape = {
      description,
      contact,
      lat,
      lng,
      addressText,
      photoUrl,
      idempotencyKey: getKey(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function getKey(): string {
    const existing = localStorage.getItem(DRAFT_KEY);
    if (existing) {
      try {
        const d = JSON.parse(existing) as DraftShape;
        if (d.idempotencyKey) return d.idempotencyKey;
      } catch {
        /* fall through */
      }
    }
    return crypto.randomUUID();
  }

  async function submit() {
    setError(null);
    const latN = Number(lat);
    const lngN = Number(lng);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
      setError("A location is required (use my location or enter coordinates).");
      return;
    }
    if (!navigator.onLine) {
      saveDraft();
      setError("You're offline. Your draft is saved and will submit on reconnect.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description: description || undefined,
          contact: contact || undefined,
          photoUrl,
          location: { lat: latN, lng: lngN },
          addressText: addressText || undefined,
          idempotencyKey: getKey(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Submission failed.");
        return;
      }
      localStorage.removeItem(DRAFT_KEY);
      if (data.status === "emergency") {
        setResult({
          kind: "emergency",
          emergencyNumber: data.emergencyNumber,
          message: data.message,
          trackingUrl: data.trackingUrl,
        });
      } else {
        setResult({
          kind: "received",
          trackingUrl: data.trackingUrl,
          reportId: data.reportId,
        });
      }
    } catch {
      saveDraft();
      setError("Network error. Draft saved; try again when connected.");
    } finally {
      setBusy(false);
    }
  }

  if (result?.kind === "emergency") {
    return (
      <PageContainer>
        {/* The only coloured surface in the system - see the note in globals.css. */}
        <Alert variant="emergency" className="text-base">
          {result.message} Call {result.emergencyNumber}.
        </Alert>
        <p className="mt-4 text-sm text-muted-foreground">
          We recorded a reference so the right team is aware:{" "}
          <Link href={result.trackingUrl} className="underline">
            track status
          </Link>
          .
        </p>
      </PageContainer>
    );
  }

  if (result?.kind === "received") {
    return (
      <PageContainer>
        <Card>
          <CardContent className="p-6 pt-6">
            <h1 className="text-xl font-semibold">Report received</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Thanks. It&apos;s in the triage queue now.
            </p>
            <Link
              href={result.trackingUrl}
              className="mt-4 inline-block text-sm underline"
            >
              Track status &rarr;
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Report an issue"
        description="A photo and a location are the most useful things you can give us. Everything else is optional."
      />

      {!online && (
        <Alert variant="notice" className="mb-4">
          Offline — your report will be saved as a draft and submitted on
          reconnect.
        </Alert>
      )}
      {error && (
        <Alert variant="notice" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 pt-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="photo">Photo (optional)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhoto}
            />
            {photoUrl && (
              <p className="text-sm text-muted-foreground">Photo attached.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Location</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={useMyLocation}
              >
                Use my location
              </Button>
              <Input
                className="max-w-[150px]"
                placeholder="latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <Input
                className="max-w-[150px]"
                placeholder="longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Input
              id="address"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g. corner of 5th & Main"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the issue?"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact">Contact for updates (optional)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="email or phone — kept off the public record"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button disabled={busy} onClick={submit}>
              {busy ? "Working…" : "Submit report"}
            </Button>
            <Button type="button" variant="secondary" onClick={saveDraft}>
              Save draft
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
