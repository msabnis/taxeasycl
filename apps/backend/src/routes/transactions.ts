import { Router } from "express";
import { listTransactionsForPeriod, updateTransactionCategory } from "../db/transactions";
import { findMerchantById } from "../db/merchants";

export const transactionsRouter = Router();

const VALID_CATEGORIES = new Set([
  "sales",
  "ingredients",
  "bank_and_card_fees",
  "rent",
  "utilities",
  "professional_services",
  "travel",
  "equipment",
  "uncategorised",
]);

/** GET /api/merchants/:merchantId/transactions?periodStart=&periodEnd= */
transactionsRouter.get("/api/merchants/:merchantId/transactions", async (req, res) => {
  const { merchantId } = req.params;
  const periodStart = String(req.query.periodStart ?? "");
  const periodEnd = String(req.query.periodEnd ?? "");

  if (!periodStart || !periodEnd) {
    return res.status(400).json({ error: "periodStart and periodEnd query params are required (YYYY-MM-DD)." });
  }

  const merchant = await findMerchantById(merchantId);
  if (!merchant) return res.status(404).json({ error: "Merchant not found." });

  const transactions = await listTransactionsForPeriod(merchantId, periodStart, periodEnd);
  res.json({ transactions });
});

/**
 * PATCH /api/transactions/:id — resolves a flagged transaction, the
 * "Not sure what this is? Tell us" affordance from Step 2 of the wizard.
 */
transactionsRouter.patch("/api/transactions/:id", async (req, res) => {
  const { category } = req.body as { category?: string };

  if (!category || !VALID_CATEGORIES.has(category)) {
    return res.status(400).json({ error: `category must be one of: ${[...VALID_CATEGORIES].join(", ")}` });
  }

  const updated = await updateTransactionCategory(req.params.id, category as never);
  if (!updated) return res.status(404).json({ error: "Transaction not found." });

  res.json({ transaction: updated });
});
