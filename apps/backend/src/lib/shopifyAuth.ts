import crypto from "node:crypto";
import { env } from "../config/env";

/**
 * Verifies the X-Shopify-Hmac-Sha256 header against the raw request body.
 * Must be called with the *raw* bytes Shopify sent — if any JSON-parsing
 * middleware has touched the body first, this will fail even for a
 * legitimate request. See middleware/rawBody.ts.
 */
export function verifyShopifyWebhookHmac(rawBody: Buffer, hmacHeader: string | undefined): boolean {
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", env.shopify.apiSecret)
    .update(rawBody)
    .digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verifies the HMAC query parameter Shopify appends to OAuth redirects
 * (distinct from the webhook header check above — same secret, different
 * construction: Shopify signs the sorted query string, not a JSON body).
 */
export function verifyShopifyOAuthQuery(query: Record<string, string>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");

  const digest = crypto.createHmac("sha256", env.shopify.apiSecret).update(message).digest("hex");

  const a = Buffer.from(digest);
  const b = Buffer.from(hmac);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
}

/**
 * Exchanges an OAuth authorization code for a permanent access token.
 * Authorization Code Grant tokens don't expire on their own — store the
 * result encrypted at rest (see AWS KMS note in the deployment plan) rather
 * than in plaintext once this moves past local development.
 */
export async function exchangeShopifyCodeForToken(
  shop: string,
  code: string
): Promise<ShopifyTokenResponse> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.shopify.apiKey,
      client_secret: env.shopify.apiSecret,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify token exchange failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as ShopifyTokenResponse;
}

/** Builds the URL to send a merchant to for the OAuth consent screen. */
export function buildShopifyInstallUrl(shop: string, state: string): string {
  const params = new URLSearchParams({
    client_id: env.shopify.apiKey,
    scope: env.shopify.scopes,
    redirect_uri: `${env.shopify.appUrl}/shopify/callback`,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}
