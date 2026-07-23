import { eq } from "drizzle-orm";
import { db } from "./client";
import { merchants } from "./schema";

export async function findMerchantById(id: string) {
  const rows = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findOrCreateMerchantByName(name: string) {
  const existing = await db.select().from(merchants).where(eq(merchants.name, name)).limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db.insert(merchants).values({ name }).returning();
  return created;
}

/**
 * TODO(auth): once real authentication exists, this goes away — the
 * frontend should get "the current merchant" from the logged-in session,
 * not by listing every merchant in the database.
 */
export async function listAllMerchants() {
  return db.select().from(merchants);
}
