// Triage step 5: open a case and dispatch it to the owning department
// (PRD 3.3 step 5). This is also where the SLA clock starts.

import { withSystem } from "../../db";
import { appendEvent } from "../../domain/audit";
import {
  resolveDepartment,
  dispatchToDepartment,
  type DispatchResult,
} from "../../domain/routing";
import { computeSlaDeadline } from "../../domain/sla";
import { env } from "../../env";
import { loadReport } from "./reportRow";

export interface RouteStepResult {
  caseId: string | null;
  routed: boolean;
  dispatch: DispatchResult | null;
}

export async function stepRoute(reportId: string): Promise<RouteStepResult> {
  return withSystem(async (db) => {
    const report = await loadReport(db, reportId);
    if (!report.jurisdiction_id || !report.category) {
      return { caseId: null, routed: false, dispatch: null };
    }

    const department = await resolveDepartment(
      db,
      report.jurisdiction_id,
      report.category,
    );

    // Nobody owns this (jurisdiction, category) pair: hold for a human rather
    // than dropping the report.
    if (!department) {
      await db.query(
        `UPDATE reports SET status = 'HELD', routing_path = 'manual_review'
         WHERE id = $1`,
        [reportId],
      );
      await appendEvent(db, {
        reportId,
        eventType: "CONFIDENCE_BRANCH",
        payload: { reason: "no_department_for_category", held: true },
      });
      return { caseId: null, routed: false, dispatch: null };
    }

    const slaDeadline = computeSlaDeadline(department.default_sla_hours);

    const created = await db.one<{ id: string }>(
      `INSERT INTO cases (
         jurisdiction_id, category, department_id, primary_location,
         report_count, status, sla_deadline
       ) VALUES (
         $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
         1, 'OPEN', $6
       ) RETURNING id`,
      [
        report.jurisdiction_id,
        report.category,
        department.id,
        report.lng,
        report.lat,
        slaDeadline.toISOString(),
      ],
    );
    if (!created) {
      throw new Error(`failed to create case for report ${reportId}`);
    }
    const caseId = created.id;

    await db.query(
      `UPDATE reports SET case_id = $2, status = 'ROUTED' WHERE id = $1`,
      [reportId, caseId],
    );
    await appendEvent(db, {
      reportId,
      caseId,
      eventType: "CASE_CREATED",
      payload: {
        departmentId: department.id,
        slaDeadline: slaDeadline.toISOString(),
      },
    });

    const dispatch = await dispatchToDepartment(department, {
      caseId,
      category: report.category,
      severity: report.severity,
      addressText: report.address_text,
      location: { lat: report.lat, lng: report.lng },
      photoUrl: report.photo_url,
      description: report.description,
      trackingUrl: `${env.appUrl.replace(/\/$/, "")}/track/${reportId}`,
    });

    await appendEvent(db, {
      reportId,
      caseId,
      eventType: "ROUTED",
      payload: { ...dispatch },
    });

    return { caseId, routed: true, dispatch };
  });
}
