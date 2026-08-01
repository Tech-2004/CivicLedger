// Triage step 2: classify, and embed the description for dedup (PRD 3.3).

import { withSystem } from "../../db";
import { appendEvent } from "../../domain/audit";
import { classifyReport } from "../../domain/classify";
import { embedText, toVectorLiteral } from "../../domain/embeddings";
import { loadReport } from "./reportRow";
import type { Classification } from "@civicledger/shared";

export async function stepClassify(reportId: string): Promise<Classification> {
  return withSystem(async (db) => {
    const report = await loadReport(db, reportId);

    const classification = await classifyReport({
      description: report.description,
      photoUrl: report.photo_url,
    });
    const embedding = await embedText(report.description ?? "");

    await db.query(
      `UPDATE reports
       SET category = $2, severity = $3, classification_confidence = $4,
           emergency_flag = $5, description_embedding = $6::vector,
           status = 'TRIAGING'
       WHERE id = $1`,
      [
        reportId,
        classification.category,
        classification.severity,
        classification.confidence,
        classification.emergencyFlag,
        toVectorLiteral(embedding),
      ],
    );
    await appendEvent(db, {
      reportId,
      eventType: "CLASSIFIED",
      payload: { ...classification },
    });

    return classification;
  });
}
