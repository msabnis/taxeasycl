import { Router } from "express";
import { env } from "../config/env";

/**
 * Placeholder routes for Companies House filing. Structure only — wire up
 * once credentials exist and the ACSP question (agent-filing vs.
 * self-filing tool) has been resolved with counsel, per the main planning
 * doc's open questions.
 */
export const companiesHouseRouter = Router();

companiesHouseRouter.get("/companies-house/status", (_req, res) => {
  res.json({
    configured: Boolean(env.companiesHouse.clientId && env.companiesHouse.clientSecret),
    note: "Confirm ACSP requirement before enabling submission-on-behalf-of-user flows.",
  });
});

// TODO: GET /companies-house/authorize — OAuth2 consent flow.
// TODO: POST /companies-house/confirmation-statements — prepare + submit.
// TODO: POST /companies-house/accounts — iXBRL generation + submit (from Apr 2027, software-only).
