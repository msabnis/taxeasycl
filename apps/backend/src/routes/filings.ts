import { Router } from "express";
import { listFilingsForMerchant, updateFilingProgress } from "../db/filings";
import { findMerchantById } from "../db/merchants";

export const filingsRouter = Router();

/** GET /api/merchants/:merchantId/filings */
filingsRouter.get("/api/merchants/:merchantId/filings", async (req, res) => {
  const merchant = await findMerchantById(req.params.merchantId);
  if (!merchant) return res.status(404).json({ error: "Merchant not found." });

  const filings = await listFilingsForMerchant(req.params.merchantId);
  res.json({ filings });
});

const VALID_STATUSES = new Set(["not_started", "in_progress", "ready_to_submit", "submitted"]);

/**
 * PATCH /api/filings/:id — advances a filing's wizard progress, or marks it
 * submitted. Every call records an audit-trail entry alongside the update
 * (see db/filings.ts) so submissions stay traceable from inputs to outputs.
 */
filingsRouter.patch("/api/filings/:id", async (req, res) => {
  const { status, stepsCompleted, hmrcReference, inputSnapshot, outputSnapshot } = req.body as {
    status?: string;
    stepsCompleted?: number;
    hmrcReference?: string;
    inputSnapshot?: unknown;
    outputSnapshot?: unknown;
  };

  if (status && !VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: `status must be one of: ${[...VALID_STATUSES].join(", ")}` });
  }

  try {
    const filing = await updateFilingProgress(
      req.params.id,
      { status: status as never, stepsCompleted, hmrcReference },
      {
        actor: "merchant",
        action: status === "submitted" ? "submitted_to_hmrc" : "updated_progress",
        inputSnapshot,
        outputSnapshot,
      }
    );
    res.json({ filing });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[filings] update failed", err);
    res.status(404).json({ error: "Filing not found." });
  }
});
