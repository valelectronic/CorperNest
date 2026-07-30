// src/app/api/marketplace/purchases/confirm/route.ts
// Buyer taps "Item Received" — marks transaction as released.
// This is the trigger for admin to pay the seller manually via Paystack.
// Payout is manual at pilot stage — admin sees email and processes via dashboard.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceTransaction, marketplaceListing, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { transactionId } = await req.json();
  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID required." }, { status: 400 });
  }

  // Fetch transaction — must belong to this buyer
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

  // Mark as released + record confirmation time
  await db.update(marketplaceTransaction)
    .set({ status: "released", confirmedAt: new Date(), updatedAt: new Date() })
    .where(eq(marketplaceTransaction.id, transactionId));

  // Fetch listing title + seller info + buyer info in parallel
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

  const itemTitle  = listing_?.title ?? "Marketplace item";
  const priceStr   = `₦${(txn.amount / 100).toLocaleString("en-NG")}`;
  const payoutStr  = `₦${(txn.sellerPayout / 100).toLocaleString("en-NG")}`;

  // Push: notify seller — they will be paid soon
  await createNotification({
    userId:  txn.sellerId,
    type:    "marketplace-payout-pending",
    title:   "Buyer confirmed receipt 🎉",
    message: `${buyerUser?.name ?? "The buyer"} confirmed they received "${itemTitle}". You will receive ${payoutStr} within 24 hours.`,
    link:    "/marketplace/my-listings",
  });

  // Push: notify buyer — transaction complete
  await createNotification({
    userId:  txn.buyerId,
    type:    "marketplace-transaction-complete",
    title:   "Transaction complete ✅",
    message: `Thank you for confirming receipt of "${itemTitle}". Payment has been released to the seller.`,
    link:    "/marketplace/purchases",
  });

  // Push: notify admin — payout action required
  // Look up admin user ID to send push, then notify
  const [adminUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, "corpernestng@gmail.com"))
    .limit(1);

  if (adminUser) {
    await createNotification({
      userId:  adminUser.id,
      type:    "marketplace-payout-required",
      title:   `💰 Payout required — ${itemTitle}`,
      message: `Buyer confirmed receipt. Pay ${payoutStr} to seller ${sellerUser?.name ?? "—"} (${sellerUser?.phone ?? "no phone"}). Ref: ${txn.paystackRef ?? "—"}`,
      link:    `/admin/marketplace`,
    });
  }

  return NextResponse.json({ success: true });
}