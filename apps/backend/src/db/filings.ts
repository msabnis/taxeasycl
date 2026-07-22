import type { Filing, FilingAuditEntry, FilingStatus, FilingType } from "@ledgerly/shared";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./client";
import { filingAuditEntries, filings } from "./schema";

function toSharedFiling(row: typeof filings.$inferSelect): Filing {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    dueDate: row.dueDate,
    stepsCompleted: row.stepsCompleted,
    submittedAt: row.submittedAt?.toISOString(),
    hmrcReference: row.hmrcReference ?? undefined,
  };
}

export async function listFilingsForMerchant(merchantId: string): Promise<Filing[]> {
  const rows = await db
    .select()
    .from(filings)
    .where(eq(filings.merchantId, merchantId))
    .orderBy(filings.dueDate);
  return rows.map(toSharedFiling);
}

export async function createFiling(
  merchantId: string,
  type: FilingType,
  dueDate: string
): Promise<Filing> {
  const [row] = await db.insert(filings).values({ merchantId, type, dueDate }).returning();
  return toSharedFiling(row);
}

/**
 * Updates a filing's status/progress and records an audit-trail entry in
 * the same call, so every state change is traceable from inputs to outputs
 * — see the "architectural principle" section of the main planning doc.
 */
export async function updateFilingProgress(
  filingId: string,
  updates: { status?: FilingStatus; stepsCompleted?: number; hmrcReference?: string },
  audit: { actor: "system" | "merchant"; action: string; inputSnapshot?: unknown; outputSnapshot?: unknown }
): Promise<Filing> {
  const [row] = await db
    .update(filings)
    .set({
      ...updates,
      submittedAt: updates.status === "submitted" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(filings.id, filingId))
    .returning();

  await db.insert(filingAuditEntries).values({
    filingId,
    actor: audit.actor,
    action: audit.action,
    inputSnapshot: audit.inputSnapshot,
    outputSnapshot: audit.outputSnapshot,
  });

  return toSharedFiling(row);
}

export async function listAuditTrail(filingId: string): Promise<FilingAuditEntry[]> {
  const rows = await db
    .select()
    .from(filingAuditEntries)
    .where(and(eq(filingAuditEntries.filingId, filingId)))
    .orderBy(desc(filingAuditEntries.timestamp));

  return rows.map((row) => ({
    filingId: row.filingId,
    timestamp: row.timestamp.toISOString(),
    actor: row.actor as "system" | "merchant",
    action: row.action,
    inputSnapshot: row.inputSnapshot ?? undefined,
    outputSnapshot: row.outputSnapshot ?? undefined,
  }));
}
