import { createId } from "@paralleldrive/cuid2";
import { boolean, date, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Mirrors packages/shared/src/types.ts — keep the two in sync.

export const transactionCategoryEnum = pgEnum("transaction_category", [
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

export const transactionSourceEnum = pgEnum("transaction_source", [
  "bank_feed",
  "statement_upload",
  "shopify",
]);

export const filingTypeEnum = pgEnum("filing_type", [
  "vat_return",
  "confirmation_statement",
  "annual_accounts",
]);

export const filingStatusEnum = pgEnum("filing_status", [
  "not_started",
  "in_progress",
  "ready_to_submit",
  "submitted",
]);

export const merchants = pgTable("merchants", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("GBP"),
  category: transactionCategoryEnum("category").notNull(),
  needsReview: boolean("needs_review").notNull().default(true),
  source: transactionSourceEnum("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const filings = pgTable("filings", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  type: filingTypeEnum("type").notNull(),
  status: filingStatusEnum("status").notNull().default("not_started"),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  stepsCompleted: integer("steps_completed").notNull().default(0),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  hmrcReference: text("hmrc_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Every filing must be traceable from inputs to outputs — see the main planning doc. */
export const filingAuditEntries = pgTable("filing_audit_entries", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  filingId: text("filing_id")
    .notNull()
    .references(() => filings.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  actor: text("actor").notNull(), // "system" | "merchant"
  action: text("action").notNull(),
  inputSnapshot: jsonb("input_snapshot"),
  outputSnapshot: jsonb("output_snapshot"),
});

/**
 * Access token stored as plaintext here — fine for local development only.
 * TODO: encrypt at rest (KMS) once on AWS, per the main planning doc.
 */
export const shopifyConnections = pgTable("shopify_connections", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  shopDomain: text("shop_domain").notNull().unique(),
  accessToken: text("access_token").notNull(),
  scope: text("scope").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
});
