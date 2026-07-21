import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // Fail loudly at startup rather than deep inside a request handler.
    // eslint-disable-next-line no-console
    console.warn(`[config] Missing env var ${name} — set it in .env before using this integration.`);
    return "";
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: required("APP_URL", "http://localhost:4000"),
  frontendUrl: required("FRONTEND_URL", "http://localhost:5173"),

  shopify: {
    apiKey: required("SHOPIFY_API_KEY"),
    apiSecret: required("SHOPIFY_API_SECRET"),
    scopes: process.env.SHOPIFY_SCOPES ?? "read_orders",
    appUrl: required("SHOPIFY_APP_URL", "http://localhost:4000"),
  },

  hmrc: {
    clientId: process.env.HMRC_CLIENT_ID ?? "",
    clientSecret: process.env.HMRC_CLIENT_SECRET ?? "",
    apiBaseUrl: process.env.HMRC_API_BASE_URL ?? "https://test-api.service.hmrc.gov.uk",
  },

  companiesHouse: {
    clientId: process.env.COMPANIES_HOUSE_CLIENT_ID ?? "",
    clientSecret: process.env.COMPANIES_HOUSE_CLIENT_SECRET ?? "",
  },
};
