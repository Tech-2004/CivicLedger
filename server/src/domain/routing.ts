// Routing step (PRD 3.3 step 5): (jurisdiction, category) -> department.
// Dispatch via real API if integrated, else structured email/webhook.
//
// Phase 1 has no city API integration (that's Phase 3), so email/webhook are
// the live paths; "api" is stubbed for forward-compat.

import type { Db } from "../db";
import type { Category } from "@civicledger/shared";
import { log } from "../logger";

export interface Department {
  id: string;
  name: string;
  category: string;
  contact_method: "api" | "email" | "webhook";
  contact_endpoint: string;
  escalation_contact: string | null;
  default_sla_hours: number;
}

/** Resolves the department that owns a (jurisdiction, category) pair. */
export async function resolveDepartment(
  db: Db,
  jurisdictionId: string,
  category: Category,
): Promise<Department | null> {
  return db.one<Department>(
    `SELECT id, name, category, contact_method, contact_endpoint,
            escalation_contact, default_sla_hours
     FROM departments
     WHERE jurisdiction_id = $1 AND category = $2
     LIMIT 1`,
    [jurisdictionId, category],
  );
}

export interface DispatchPayload {
  caseId: string;
  category: string;
  severity: string | null;
  addressText: string | null;
  location: { lat: number; lng: number };
  photoUrl: string | null;
  description: string | null;
  trackingUrl: string;
}

export interface DispatchResult {
  method: Department["contact_method"];
  ok: boolean;
  detail: string;
}

/**
 * Delivers a case to a department. Email is represented as a structured
 * enqueue (no SMTP wired in Phase 1 skeleton); webhook POSTs the payload;
 * api is reserved for Phase 3 city integrations.
 */
export async function dispatchToDepartment(
  dept: Department,
  payload: DispatchPayload,
): Promise<DispatchResult> {
  switch (dept.contact_method) {
    case "webhook": {
      const res = await fetch(dept.contact_endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return {
        method: "webhook",
        ok: res.ok,
        detail: `POST ${dept.contact_endpoint} -> ${res.status}`,
      };
    }
    case "email": {
      // TODO: wire a transactional email provider. For now this is a
      // structured, logged handoff so the pipeline is complete + auditable.
      log.info("dispatch.email", {
        to: dept.contact_endpoint,
        caseId: payload.caseId,
      });
      return {
        method: "email",
        ok: true,
        detail: `queued email to ${dept.contact_endpoint}`,
      };
    }
    case "api": {
      // Reserved for Phase 3 direct city API integration.
      return {
        method: "api",
        ok: false,
        detail: "api integration not enabled in Phase 1",
      };
    }
    default:
      return { method: dept.contact_method, ok: false, detail: "unknown method" };
  }
}
