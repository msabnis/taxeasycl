import { Router } from "express";
import { env } from "../config/env";

/**
 * Placeholder routes for the HMRC MTD VAT integration. Structure only —
 * wire these up once sandbox credentials from the HMRC Developer Hub are
 * available. Every real submission must include the legally-required
 * fraud-prevention headers (device/browser/IP metadata); build that
 * middleware before this goes anywhere near production data.
 */
export const hmrcRouter = Router();

hmrcRouter.get("/hmrc/status", (_req, res) => {
  res.json({
    configured: Boolean(env.hmrc.clientId && env.hmrc.clientSecret),
    apiBaseUrl: env.hmrc.apiBaseUrl,
    note: "Sandbox-first: register at the HMRC Developer Hub before adding real OAuth/submission logic here.",
  });
});

// TODO: GET /hmrc/authorize — redirect merchant to HMRC's OAuth consent screen (per-user consent).
// TODO: GET /hmrc/callback — exchange auth code for access/refresh tokens, store encrypted.
// TODO: POST /hmrc/vat-returns — submit a prepared VAT return, with fraud-prevention headers attached.
