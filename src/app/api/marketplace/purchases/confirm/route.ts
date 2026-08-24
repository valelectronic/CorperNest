// src/app/api/marketplace/purchases/confirm/route.ts
// Buyer taps "Item Received" — marks transaction as "buyer_confirmed".
// This does NOT release payment yet — admin verifies and clicks Release.
// Flow: escrow → buyer_confirmed → (admin releases) → released
// Admin receives full buyer + seller details via push + email to verify before releasing payout.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceTransaction, marketplaceListing, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { transactionId } = await req.json();
  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID required." }, { status: 400 });
  }

  // Fetch transaction — must belong to this buyer and be in escrow
  const [txn] = await db
    .select()
    .from(marketplaceTransaction)
    .where(and(
      eq(marketplaceTransaction.id, transactionId),
      eq(marketplaceTransaction.buyerId, session.user.id),
    ))
    .limit(1);

  if (!txn) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  if (txn.status !== "escrow") {
    return NextResponse.json({ error: "This transaction cannot be confirmed at this stage." }, { status: 400 });
  }

  // ── Mark as buyer_confirmed + record confirmation time ────────────────────
  // Status stays here until admin verifies and clicks Release
  await db.update(marketplaceTransaction)
    .set({ status: "buyer_confirmed", confirmedAt: new Date(), updatedAt: new Date() })
    .where(eq(marketplaceTransaction.id, transactionId));

  // ── Mark listing as sold ──────────────────────────────────────────────────
  // Item is no longer available — buyer has confirmed receipt
  await db.update(marketplaceListing)
    .set({ status: "sold", updatedAt: new Date() })
    .where(eq(marketplaceListing.id, txn.listingId));

  // ── Fetch details for notifications ──────────────────────────────────────
  const [[listing_], [sellerUser], [buyerUser]] = await Promise.all([
    db.select({ title: marketplaceListing.title })
      .from(marketplaceListing)
      .where(eq(marketplaceListing.id, txn.listingId))
      .limit(1),
    db.select({ name: user.name, phone: user.phoneNumber })
      .from(user)
      .where(eq(user.id, txn.sellerId))
      .limit(1),
    db.select({ name: user.name, phone: user.phoneNumber })
      .from(user)
      .where(eq(user.id, txn.buyerId))
      .limit(1),
  ]);

  const itemTitle = listing_?.title ?? "Marketplace item";
  const payoutStr = `₦${(txn.sellerPayout / 100).toLocaleString("en-NG")}`;

  // ── Notify seller — payout pending admin verification ────────────────────
  await createNotification({
    userId:  txn.sellerId,
    type:    "marketplace-payout-pending",
    title:   "Buyer confirmed receipt 🎉",
    message: `${buyerUser?.name ?? "The buyer"} confirmed they received "${itemTitle}". Your payout of ${payoutStr} is being processed — you will receive it within 24 hours.`,
    link:    "/marketplace/my-listings",
  });

  // ── Notify buyer — confirmation recorded ─────────────────────────────────
  await createNotification({
    userId:  txn.buyerId,
    type:    "marketplace-transaction-complete",
    title:   "Delivery confirmed ✅",
    message: `Thank you for confirming receipt of "${itemTitle}". Seller payout is being processed.`,
    link:    "/marketplace/purchases",
  });

  // ── Notify admin in-app — release action required ─────────────────────────
  const [adminUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com"))
    .limit(1);

  if (adminUser) {
    await createNotification({
      userId:  adminUser.id,
      type:    "marketplace-payout-required",
      title:   `💰 Release payout — ${itemTitle}`,
      message: `Buyer confirmed receipt. Verify and release ${payoutStr} to ${sellerUser?.name ?? "seller"} (${sellerUser?.phone ?? "no phone"}). Buyer: ${buyerUser?.name ?? "—"} (${buyerUser?.phone ?? "no phone"}).`,
      link:    `/admin/marketplace/transactions`,
    });
  }

  // ── Email admin — backup to push, more reliable for payout action ─────────
  await sendAdminEmail(
    `💰 Payout Required — ${itemTitle}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#15803D;margin:0 0 4px">Buyer Confirmed Receipt</h2>
        <p style="color:#6B7280;margin:0 0 20px;font-size:13px">
          Action required — verify and release payout to seller via Paystack
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280;width:140px">Item</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:600">${itemTitle}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Payout amount</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:700;color:#15803D">${payoutStr}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Seller</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${sellerUser?.name ?? "—"} · ${sellerUser?.phone ?? "no phone"}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Buyer</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${buyerUser?.name ?? "—"} · ${buyerUser?.phone ?? "no phone"}</td></tr>
          <tr><td style="padding:10px 0;color:#6B7280">Paystack ref</td>
              <td style="padding:10px 0;font-family:monospace;font-size:12px">${txn.paystackRef ?? "—"}</td></tr>
        </table>
        <a href="https://www.corpernest.com.ng/admin/marketplace/transactions"
           style="display:inline-block;padding:12px 24px;background:#15803D;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
          Release Payout in Admin →
        </a>
        <p style="margin-top:16px;font-size:12px;color:#9CA3AF">
          ⚠️ Pay via Paystack dashboard only — NOT via Moniepoint or any bank app.
        </p>
      </div>
    `
  ).catch(() => {});

  return NextResponse.json({ success: true });
}