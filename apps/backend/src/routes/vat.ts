import { Router } from "express";
import { listTransactionsForPeriod } from "../db/transactions";
import { findMerchantById } from "../db/merchants";
import { computeVatFigures, UnresolvedTransactionsError } from "../engine/vat";

export const vatRouter = Router();

/**
 * GET /api/merchants/:merchantId/vat-figures?periodStart=YYYY-MM-DD&periodEnd=YYYY-MM-DD
 *
 * Pulls the merchant's real transactions for the period from Postgres and
 * runs them through the VAT engine — this is the first route that
 * connects the database layer to the calculation engine end-to-end.
 */
vatRouter.get("/api/merchants/:merchantId/vat-figures", async (req, res) => {
  const { merchantId } = req.params;
  const periodStart = String(req.query.periodStart ?? "");
  const periodEnd = String(req.query.periodEnd ?? "");

  if (!periodStart || !periodEnd) {
    return res.status(400).json({ error: "periodStart and periodEnd query params are required (YYYY-MM-DD)." });
  }

  const merchant = await findMerchantById(merchantId);
  if (!merchant) {
    return res.status(404).json({ error: "Merchant not found." });
  }

  const transactions = await listTransactionsForPeriod(merchantId, periodStart, periodEnd);

  try {
    const figures = computeVatFigures(transactions, periodStart, periodEnd);
    return res.json({ merchant: merchant.name, transactionCount: transactions.length, figures });
  } catch (err) {
    if (err instanceof UnresolvedTransactionsError) {
      return res.status(409).json({
        error: err.message,
        code: "UNRESOLVED_TRANSACTIONS",
        unresolvedCount: err.count,
      });
    }
    throw err;
  }
});
