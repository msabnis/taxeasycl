import { Router } from "express";
import crypto from "node:crypto";
import {
  buildShopifyInstallUrl,
  exchangeShopifyCodeForToken,
  verifyShopifyOAuthQuery,
} from "../../lib/shopifyAuth";

export const shopifyOAuthRouter = Router();

/**
 * TODO(storage): replace with a persisted, encrypted store keyed by shop
 * domain. This in-memory map is only here so the flow is runnable locally;
 * it is lost on every restart and is not appropriate for production.
 */
const stateStore = new Map<string, { shop: string; createdAt: number }>();

/** Step 1 — merchant clicks "Connect your Shopify store" in our dashboard. */
shopifyOAuthRouter.get("/shopify/install", (req, res) => {
  const shop = String(req.query.shop ?? "");
  if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return res.status(400).json({ error: "A valid shop domain is required, e.g. ?shop=example.myshopify.com" });
  }

  const state = crypto.randomBytes(16).toString("hex");
  stateStore.set(state, { shop, createdAt: Date.now() });

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

    // TODO(storage): persist tokenResponse.access_token encrypted at rest,
    // associated with the merchant's account, not just the shop domain.
    // eslint-disable-next-line no-console
    console.log(`[shopify] connected ${shop} with scopes: ${tokenResponse.scope}`);

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
