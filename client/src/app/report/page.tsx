"use client";

import { useEffect, useState } from "react";


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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error("Supabase credentials not configured in environment");
      }

      const res = await fetch(`${supabaseUrl}/storage/v1/object/civicledger-media/${fileName}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${anonKey}`,
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/civicledger-media/${fileName}`;
      setPhotoUrl(publicUrl);
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
      <div>
        <div className="banner emergency">
          {result.message} Call {result.emergencyNumber}.
        </div>
        <p className="muted">
          We recorded a reference so the right team is aware:{" "}
          <a href={result.trackingUrl}>track status</a>.
        </p>
      </div>
    );
  }

  if (result?.kind === "received") {
    return (
      <div className="card">
        <h1>Report received</h1>
        <p className="muted">
          Thanks. It&apos;s in the triage queue now.
        </p>
        <p>
          <a href={result.trackingUrl}>Track status &rarr;</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Report an issue</h1>
      {!online && (
        <div className="banner" style={{ background: "var(--panel-2)" }}>
          Offline - your report will be saved as a draft and submitted on
          reconnect.
        </div>
      )}
      {error && (
        <div className="banner" style={{ background: "var(--panel-2)" }}>
          {error}
        </div>
      )}

      <div className="card">
        <label>Photo (optional)</label>
        <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
        {photoUrl && <p className="muted">Photo attached.</p>}

        <label>Location</label>
        <div className="row">
          <button type="button" className="secondary" onClick={useMyLocation}>
            Use my location
          </button>
          <input
            style={{ maxWidth: 160 }}
            placeholder="latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
          <input
            style={{ maxWidth: 160 }}
            placeholder="longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>

        <label>Address (optional)</label>
        <input
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder="e.g. corner of 5th & Main"
        />

        <label>Description (optional)</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's the issue?"
        />

        <label>Contact for updates (optional)</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="email or phone - anonymous by default"
        />

        <div className="row" style={{ marginTop: 16 }}>
          <button disabled={busy} onClick={submit}>
            {busy ? "Working..." : "Submit report"}
          </button>
          <button type="button" className="secondary" onClick={saveDraft}>
            Save draft
          </button>
        </div>
      </div>
    </div>
  );
}
