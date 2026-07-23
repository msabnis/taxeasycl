import type { Filing, Transaction, TransactionCategory, VatFigures } from "@ledgerly/shared";

/**
 * In dev, Vite's proxy (see vite.config.ts) forwards /api to the backend,
 * so a relative path works. In production, set VITE_API_BASE_URL to the
 * deployed backend's URL (e.g. once the frontend moves to Vercel and the
 * backend stays on Railway, per the main planning doc).
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Request to ${path} failed (${response.status})`, response.status, body.code, body);
  }

  return response.json() as Promise<T>;
}

export interface Merchant {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * TODO(auth): stands in for "the logged-in merchant" until real
 * authentication exists — takes the first merchant in the database.
 */
export async function getCurrentMerchant(): Promise<Merchant> {
  const { merchants } = await request<{ merchants: Merchant[] }>("/api/merchants");
  if (merchants.length === 0) {
    throw new ApiError("No merchants found — run `npm run db:seed --workspace apps/backend`.", 404);
  }
  return merchants[0];
}

export async function getFilings(merchantId: string): Promise<Filing[]> {
  const { filings } = await request<{ filings: Filing[] }>(`/api/merchants/${merchantId}/filings`);
  return filings;
}

export async function updateFiling(
  filingId: string,
  updates: {
    status?: Filing["status"];
    stepsCompleted?: number;
    hmrcReference?: string;
    inputSnapshot?: unknown;
    outputSnapshot?: unknown;
  }
): Promise<Filing> {
  const { filing } = await request<{ filing: Filing }>(`/api/filings/${filingId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return filing;
}

export async function getTransactions(
  merchantId: string,
  periodStart: string,
  periodEnd: string
): Promise<Transaction[]> {
  const { transactions } = await request<{ transactions: Transaction[] }>(
    `/api/merchants/${merchantId}/transactions?periodStart=${periodStart}&periodEnd=${periodEnd}`
  );
  return transactions;
}

export async function categoriseTransaction(
  transactionId: string,
  category: TransactionCategory
): Promise<Transaction> {
  const { transaction } = await request<{ transaction: Transaction }>(`/api/transactions/${transactionId}`, {
    method: "PATCH",
    body: JSON.stringify({ category }),
  });
  return transaction;
}

export interface VatFiguresResponse {
  merchant: string;
  transactionCount: number;
  figures: VatFigures;
}

/** Throws ApiError with code UNRESOLVED_TRANSACTIONS (409) if any transaction still needs review. */
export async function getVatFigures(
  merchantId: string,
  periodStart: string,
  periodEnd: string
): Promise<VatFiguresResponse> {
  return request<VatFiguresResponse>(
    `/api/merchants/${merchantId}/vat-figures?periodStart=${periodStart}&periodEnd=${periodEnd}`
  );
}
