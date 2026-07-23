import { Router } from "express";
import { findMerchantById, listAllMerchants } from "../db/merchants";

export const merchantsRouter = Router();

/**
 * TODO(auth): this route only makes sense pre-authentication, where the
 * frontend has no session to derive "the current merchant" from. Once
 * login exists, replace with a proper /api/me or session-based lookup.
 */
merchantsRouter.get("/api/merchants", async (_req, res) => {
  const merchants = await listAllMerchants();
  res.json({ merchants });
});

merchantsRouter.get("/api/merchants/:merchantId", async (req, res) => {
  const merchant = await findMerchantById(req.params.merchantId);
  if (!merchant) return res.status(404).json({ error: "Merchant not found." });
  res.json({ merchant });
});
