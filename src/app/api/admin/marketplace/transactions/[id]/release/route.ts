// src/app/api/admin/marketplace/transactions/[id]/release/route.ts
// Marks a transaction as released and triggers automated payout to seller via Paystack Transfers.
// Flow:
//   1. Fetch seller's stored recipient_code (created during bank verification)
//   2. If recipient_code exists → trigger Paystack Transfer immediately
//   3. If missing → attempt JIT (Just-In-Time) recipient creation using seller's bank details
//   4. If JIT also fails → mark as needs_manual_payout — admin pays via Paystack dashboard
//   5. Mark transaction released + listing sold + notify seller regardless of payout method

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceTransaction, marketplaceListing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL      = process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com";
const PAYSTACK_SECRET  = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // ── 1. Fetch transaction ──────────────────────────────────────────────────
  const [txn] = await db
    .select()
    .from(marketplaceTransaction)
    .where(eq(marketplaceTransaction.id, id))
    .limit(1);

  if (!txn) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  if (txn.status !== "buyer_confirmed") return NextResponse.json({ error: "Transaction has not been confirmed by buyer yet." }, { status: 400 });

  // ── 2. Fetch seller bank details + recipient code ─────────────────────────
  const [seller] = await db
    .select({
      id:                  user.id,
      marketRecipientCode: user.marketRecipientCode,
      marketAccountNumber: user.marketAccountNumber,
      marketBankCode:      user.marketBankCode,
      marketAccountName:   user.marketAccountName,
    })
    .from(user)
    .where(eq(user.id, txn.sellerId))
    .limit(1);

  // ── 3. Attempt Paystack Transfer ──────────────────────────────────────────
  let recipientCode  = seller?.marketRecipientCode ?? null;
  let payoutMethod   = "pending";

  // If no recipient code — attempt JIT creation using seller's saved bank details
  if (!recipientCode && seller?.marketAccountNumber && seller?.marketBankCode) {
    try {
      const jitRes = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type:           "nuban",
          name:           seller.marketAccountName ?? "Seller",
          account_number: seller.marketAccountNumber,
          bank_code:      seller.marketBankCode,
          currency:       "NGN",
        }),
      });

      const jitData = await jitRes.json();
      if (jitData?.data?.recipient_code) {
        recipientCode = jitData.data.recipient_code;
        // Save for future transactions
        await db.update(user)
          .set({ marketRecipientCode: recipientCode })
          .where(eq(user.id, txn.sellerId))
          .catch(() => {});
      }
    } catch {
      console.error("[release] JIT recipient creation failed for seller:", txn.sellerId);
    }
  }

  // Trigger Paystack Transfer if we have a recipient code
  if (recipientCode) {
    try {
      const transferRes = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source:    "balance",
          amount:    txn.sellerPayout,     // already in kobo
          recipient: recipientCode,
          reason:    `CorperNest order payout — ${id}`,
        }),
      });

      const transferData = await transferRes.json();

      if (transferRes.ok && transferData?.data?.status) {
        payoutMethod = "paystack_transfer";
        console.log(`[release] Paystack transfer initiated: ${transferData.data.transfer_code}`);
      } else {
        // Transfer call succeeded but Paystack returned an error
        payoutMethod = "needs_manual_payout";
        console.error("[release] Paystack transfer failed:", transferData?.message);
      }
    } catch {
      payoutMethod = "needs_manual_payout";
      console.error("[release] Paystack transfer exception for txn:", id);
    }
  } else {
    // No recipient code after JIT attempt — flag for manual payout
    payoutMethod = "needs_manual_payout";
    console.error("[release] No recipient code available for seller:", txn.sellerId);
  }

  // ── 4. Mark transaction released + listing sold ───────────────────────────
  // Always release regardless of payout method — admin handles manual if needed
  await db.update(marketplaceTransaction)
    .set({
      status:     "released",
      releasedAt: new Date(),
      updatedAt:  new Date(),
    })
    .where(eq(marketplaceTransaction.id, id));

  await db.update(marketplaceListing)
    .set({ status: "sold", updatedAt: new Date() })
    .where(eq(marketplaceListing.id, txn.listingId));

  // ── 5. Fetch listing title for notification ───────────────────────────────
  const [listing] = await db
    .select({ title: marketplaceListing.title })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, txn.listingId))
    .limit(1);

  const payoutStr = `₦${(txn.sellerPayout / 100).toLocaleString("en-NG")}`;

  // ── 6. Notify seller ──────────────────────────────────────────────────────
  await createNotification({
    userId:  txn.sellerId,
    type:    "marketplace-payout-sent",
    title:   "Your payout has been sent 💰",
    message: payoutMethod === "paystack_transfer"
      ? `${payoutStr} for "${listing?.title ?? "your item"}" has been transferred to your bank account.`
      : `${payoutStr} for "${listing?.title ?? "your item"}" is being processed. Contact support if not received within 24 hours.`,
    link:    "/marketplace/my-listings",
  });

  return NextResponse.json({
    success:      true,
    payoutMethod, // "paystack_transfer" | "needs_manual_payout"
  });
}