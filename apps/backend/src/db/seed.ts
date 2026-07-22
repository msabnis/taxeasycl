import "dotenv/config";
import { pool } from "./client";
import { findOrCreateMerchantByName } from "./merchants";
import { insertTransactions } from "./transactions";
import { createFiling } from "./filings";

async function main() {
  const merchant = await findOrCreateMerchantByName("Priya's Bakery");
  console.log(`Merchant: ${merchant.name} (${merchant.id})`);

  const inserted = await insertTransactions(merchant.id, [
    {
      date: "2026-07-01",
      description: "Thornfield Catering — invoice paid",
      amountMinor: 1_116_000,
      currency: "GBP",
      category: "sales",
      needsReview: false,
      source: "bank_feed",
    },
    {
      date: "2026-07-02",
      description: "Ashgrove Accountancy — quarterly bookkeeping",
      amountMinor: -367_440,
      currency: "GBP",
      category: "professional_services",
      needsReview: false,
      source: "bank_feed",
    },
    {
      date: "2026-07-04",
      description: "Wholesale Flour Co.",
      amountMinor: -18_640,
      currency: "GBP",
      category: "ingredients",
      needsReview: false,
      source: "bank_feed",
    },
    {
      date: "2026-07-06",
      description: "Square Card Fees",
      amountMinor: -2_410,
      currency: "GBP",
      category: "bank_and_card_fees",
      needsReview: false,
      source: "bank_feed",
    },
    {
      date: "2026-07-09",
      description: "Office World Ltd",
      amountMinor: -5_800,
      currency: "GBP",
      category: "uncategorised",
      needsReview: true,
      source: "bank_feed",
    },
  ]);
  console.log(`Inserted ${inserted.length} transactions.`);

  const filing = await createFiling(merchant.id, "vat_return", "2026-08-07");
  console.log(`Created filing: ${filing.type} due ${filing.dueDate} (${filing.id})`);

  await pool.end();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
