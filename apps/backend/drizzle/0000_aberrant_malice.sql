CREATE TYPE "public"."filing_status" AS ENUM('not_started', 'in_progress', 'ready_to_submit', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."filing_type" AS ENUM('vat_return', 'confirmation_statement', 'annual_accounts');--> statement-breakpoint
CREATE TYPE "public"."transaction_category" AS ENUM('sales', 'ingredients', 'bank_and_card_fees', 'rent', 'utilities', 'professional_services', 'travel', 'equipment', 'uncategorised');--> statement-breakpoint
CREATE TYPE "public"."transaction_source" AS ENUM('bank_feed', 'statement_upload', 'shopify');--> statement-breakpoint
CREATE TABLE "filing_audit_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"filing_id" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"input_snapshot" jsonb,
	"output_snapshot" jsonb
);
--> statement-breakpoint
CREATE TABLE "filings" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"type" "filing_type" NOT NULL,
	"status" "filing_status" DEFAULT 'not_started' NOT NULL,
	"due_date" date NOT NULL,
	"steps_completed" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp with time zone,
	"hmrc_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"shop_domain" text NOT NULL,
	"access_token" text NOT NULL,
	"scope" text NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopify_connections_shop_domain_unique" UNIQUE("shop_domain")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"category" "transaction_category" NOT NULL,
	"needs_review" boolean DEFAULT true NOT NULL,
	"source" "transaction_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "filing_audit_entries" ADD CONSTRAINT "filing_audit_entries_filing_id_filings_id_fk" FOREIGN KEY ("filing_id") REFERENCES "public"."filings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_connections" ADD CONSTRAINT "shopify_connections_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;