import { Router } from "express";
import crypto from "node:crypto";
import {
  buildShopifyInstallUrl,
  exchangeShopifyCodeForToken,
  verifyShopifyOAuthQuery,
} from "../../lib/shopifyAuth";
import { findMerchantById } from "../../db/merchants";
import { upsertShopifyConnection } from "../../db/shopifyConnections";

export const shopifyOAuthRouter = Router();

/**
 * State only needs to survive the few seconds of the OAuth round-trip, so
 * an in-memory map is fine here (unlike the access token itself, which is
 * now persisted — see db/shopifyConnections.ts). If the backend runs as
 * multiple instances behind a load balancer, swap this for Redis.
 */
const stateStore = new Map<string, { shop: string; merchantId: string; createdAt: number }>();

/**
 * Step 1 — merchant clicks "Connect your Shopify store" in our dashboard.
 * Requires ?shop=<shop>.myshopify.com&merchant_id=<id> — merchant_id
 * identifies which Ledgerly merchant is connecting, standing in for a real
 * session until auth exists.
 */
shopifyOAuthRouter.get("/shopify/install", async (req, res) => {
  const shop = String(req.query.shop ?? "");
  const merchantId = String(req.query.merchant_id ?? "");

  if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return res.status(400).json({ error: "A valid shop domain is required, e.g. ?shop=example.myshopify.com" });
  }

  const merchant = merchantId ? await findMerchantById(merchantId) : null;
  if (!merchant) {
    return res.status(400).json({ error: "A valid merchant_id is required to connect a Shopify store." });
  }

  const state = crypto.randomBytes(16).toString("hex");
  stateStore.set(state, { shop, merchantId, createdAt: Date.now() });

  return res.redirect(buildShopifyInstallUrl(shop, state));
});

/** Step 2 — Shopify redirects back here after the merchant grants access. */
shopifyOAuthRouter.get("/shopify/callback", async (req, res) => {
  const query = req.query as Record<string, string>;
  const { shop, code, state } = query;

  const pending = state ? stateStore.get(state) : undefined;
  if (!pending || pending.shop !== shop) {
    return res.status(403).json({ error: "Invalid or expired state — restart the connection from Ledgerly." });
  }
  stateStore.delete(state);

  if (!verifyShopifyOAuthQuery(query)) {
    return res.status(403).json({ error: "HMAC verification failed." });
  }

  try {
    const tokenResponse = await exchangeShopifyCodeForToken(shop, code);

    // NOTE: stored as plaintext for local development. TODO: encrypt at
    // rest (KMS) before this holds any real merchant's credentials.
    await upsertShopifyConnection({
      merchantId: pending.merchantId,
      shopDomain: shop,
      accessToken: tokenResponse.access_token,
      scope: tokenResponse.scope,
    });

    // eslint-disable-next-line no-console
    console.log(`[shopify] connected ${shop} for merchant ${pending.merchantId} (scopes: ${tokenResponse.scope})`);

    return res.redirect(`/shopify/connected?shop=${encodeURIComponent(shop)}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[shopify] token exchange failed", err);
    return res.status(502).json({ error: "Could not complete the Shopify connection. Please try again." });
  }
});

shopifyOAuthRouter.get("/shopify/connected", (req, res) => {
  res.json({ status: "connected", shop: req.query.shop });
});

