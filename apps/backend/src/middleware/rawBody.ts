import express from "express";

/**
 * Shopify webhook HMAC verification needs the exact raw bytes of the
 * request body. Express's normal express.json() middleware parses and
 * re-serializes the body, which breaks the signature check — so this
 * must be mounted on webhook routes *instead of* express.json(), not
 * alongside it.
 */
export const shopifyRawBodyParser = express.raw({ type: "application/json" });
