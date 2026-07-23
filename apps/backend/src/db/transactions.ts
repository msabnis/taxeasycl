import type { Transaction } from "@ledgerly/shared";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "./client";
import { transactions } from "./schema";

function toSharedTransaction(row: typeof transactions.$inferSelect): Transaction {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amountMinor: row.amountMinor,
    currency: "GBP",
    category: row.category,
    needsReview: row.needsReview,
    source: row.source,
  };
}

export async function listTransactionsForPeriod(
  merchantId: string,
  periodStart: string,
  periodEnd: string
): Promise<Transaction[]> {
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.merchantId, merchantId),
        gte(transactions.date, periodStart),
        lte(transactions.date, periodEnd)
      )
    );

  return rows.map(toSharedTransaction);
}

export async function insertTransactions(
  merchantId: string,
  items: Omit<Transaction, "id">[]
): Promise<Transaction[]> {
  if (items.length === 0) return [];

  const rows = await db
    .insert(transactions)
    .values(
      items.map((t) => ({
        merchantId,
        date: t.date,
        description: t.description,
        amountMinor: t.amountMinor,
        currency: t.currency,
        category: t.category,
        needsReview: t.needsReview,
        source: t.source,
      }))
    )
    .returning();

  return rows.map(toSharedTransaction);
}

/** Resolves a flagged transaction — the "tell us" affordance in Step 2. */
export async function updateTransactionCategory(
  id: string,
  category: Transaction["category"]
): Promise<Transaction | null> {
  const [row] = await db
    .update(transactions)
    .set({ category, needsReview: false })
    .where(eq(transactions.id, id))
    .returning();

  return row ? toSharedTransaction(row) : null;
}
