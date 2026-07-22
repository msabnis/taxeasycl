import { eq } from "drizzle-orm";
import { db } from "./client";
import { shopifyConnections } from "./schema";

export async function upsertShopifyConnection(params: {
  merchantId: string;
  shopDomain: string;
  accessToken: string;
  scope: string;
}) {
  const existing = await db
    .select()
    .from(shopifyConnections)
    .where(eq(shopifyConnections.shopDomain, params.shopDomain))
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(shopifyConnections)
      .set({ accessToken: params.accessToken, scope: params.scope })
      .where(eq(shopifyConnections.shopDomain, params.shopDomain))
      .returning();
    return updated;
  }

  const [created] = await db.insert(shopifyConnections).values(params).returning();
  return created;
}

export async function findShopifyConnectionByShop(shopDomain: string) {
  const rows = await db
    .select()
    .from(shopifyConnections)
    .where(eq(shopifyConnections.shopDomain, shopDomain))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteShopifyConnectionByShop(shopDomain: string) {
  const rows = await db
    .delete(shopifyConnections)
    .where(eq(shopifyConnections.shopDomain, shopDomain))
    .returning();
  return rows[0] ?? null;
}
