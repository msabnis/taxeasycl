import { Router } from "express";
import { shopifyRawBodyParser } from "../../middleware/rawBody";
import { verifyShopifyWebhookHmac } from "../../lib/shopifyAuth";
import { deleteShopifyConnectionByShop } from "../../db/shopifyConnections";

export const shopifyWebhooksRouter = Router();

/**
 * Single endpoint handling every subscribed topic, dispatched on the
 * X-Shopify-Topic header. Mandatory GDPR compliance webhooks
 * (customers/data_request, customers/redact, shop/redact) must be
 * registered in shopify.app.toml or the Partner Dashboard, and — per
 * Shopify's requirements — must respond with a 200-series status quickly;
 * the actual data lookup/redaction work should happen asynchronously
 * afterward, not inline in this handler.
 */
shopifyWebhooksRouter.post("/shopify/webhooks", shopifyRawBodyParser, (req, res) => {
  const rawBody = req.body as Buffer;
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  const topic = req.get("X-Shopify-Topic") ?? "unknown";
  const shopDomain = req.get("X-Shopify-Shop-Domain") ?? "unknown";

  if (!verifyShopifyWebhookHmac(rawBody, hmacHeader)) {
    return res.status(401).json({ error: "HMAC verification failed" });
  }

  // Acknowledge immediately — Shopify retries on anything outside 2xx.
  res.status(200).json({ received: true });

  // Hand off to async processing. In production this should enqueue a job
  // rather than run inline in the request (see the setup guide's "fast
  // response, async processing" note).
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    // eslint-disable-next-line no-console
    console.error(`[shopify] could not parse payload for topic ${topic}`);
    return;
  }

  switch (topic) {
    case "customers/data_request":
      // Ledgerly doesn't store Shopify customer PII (only shop-level
      // connection + our own transaction records, which don't include
      // customer identity fields) — nothing to gather here today, but
      // revisit if order-level customer data is ever stored.
      // eslint-disable-next-line no-console
      console.log(`[shopify][gdpr] data_request for ${shopDomain} — no customer PII held`, payload);
      break;

    case "customers/redact":
      // Same as above — no customer-level data to redact today.
      // eslint-disable-next-line no-console
      console.log(`[shopify][gdpr] customers/redact for ${shopDomain} — no customer PII held`, payload);
      break;

    case "shop/redact":
      // Erase the persisted OAuth connection for this shop. Doesn't touch
      // the merchant's other Ledgerly data (bank transactions, filings) —
      // only what this integration itself stored.
      deleteShopifyConnectionByShop(shopDomain)
        .then((deleted) => {
          // eslint-disable-next-line no-console
          console.log(`[shopify][gdpr] shop/redact for ${shopDomain} — connection ${deleted ? "removed" : "not found"}`);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(`[shopify][gdpr] shop/redact failed for ${shopDomain}`, err);
        });
      break;

    case "orders/create":
    case "orders/updated":
      // TODO: enqueue a sync job to pull the order into our transaction
      // store and mark the merchant's VAT position as needing recalculation.
      // eslint-disable-next-line no-console
      console.log(`[shopify] ${topic} for ${shopDomain}`, payload);
      break;

    default:
      // eslint-disable-next-line no-console
      console.log(`[shopify] unhandled topic: ${topic}`);
  }
});
