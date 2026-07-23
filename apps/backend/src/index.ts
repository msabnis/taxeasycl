import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { hmrcRouter } from "./routes/hmrc";
import { companiesHouseRouter } from "./routes/companies-house";
import { vatRouter } from "./routes/vat";
import { merchantsRouter } from "./routes/merchants";
import { transactionsRouter } from "./routes/transactions";
import { filingsRouter } from "./routes/filings";
import { shopifyOAuthRouter } from "./routes/shopify/oauth";
import { shopifyWebhooksRouter } from "./routes/shopify/webhooks";

const app = express();

// Shopify webhook routes need the raw body for HMAC verification, so they
// mount their own express.raw() parser (see middleware/rawBody.ts) and must
// be registered before the general express.json() below.
app.use(shopifyWebhooksRouter);

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

app.use(healthRouter);
app.use(hmrcRouter);
app.use(companiesHouseRouter);
app.use(vatRouter);
app.use(merchantsRouter);
app.use(transactionsRouter);
app.use(filingsRouter);
app.use(shopifyOAuthRouter);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[ledgerly-backend] listening on port ${env.port} (${env.nodeEnv})`);
});
