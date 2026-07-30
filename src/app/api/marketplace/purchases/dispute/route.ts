// src/app/api/marketplace/purchases/dispute/route.ts
// Buyer raises a dispute — item not received or not as described.
// Freezes the transaction and alerts admin to intervene.
// Admin contacts both parties using phone numbers in the email.

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

  const { transactionId, reason } = await req.json();
  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID required." }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Disputes can only be raised on active escrow transactions." }, { status: 400 });
  }

  // Mark as disputed — payment stays frozen until admin resolves
  await db.update(marketplaceTransaction)
    .set({ status: "disputed", updatedAt: new Date() })
    .where(eq(marketplaceTransaction.id, transactionId));

  // Fetch listing + both parties in parallel
  const [[listing_], [buyerUser], [sellerUser]] = await Promise.all([
    db.select({ title: marketplaceListing.title })
      .from(marketplaceListing)
      .where(eq(marketplaceListing.id, txn.listingId))
      .limit(1),
    db.select({ name: user.name, phone: user.phoneNumber })
      .from(user)
      .where(eq(user.id, txn.buyerId))
      .limit(1),
    db.select({ name: user.name, phone: user.phoneNumber })
      .from(user)
      .where(eq(user.id, txn.sellerId))
      .limit(1),
  ]);

  const itemTitle = listing_?.title ?? "Marketplace item";
  const priceStr  = `₦${(txn.amount / 100).toLocaleString("en-NG")}`;

  // Push: notify seller — dispute raised
  await createNotification({
    userId:  txn.sellerId,
    type:    "marketplace-dispute-raised",
    title:   "Buyer raised a dispute ⚠️",
    message: `The buyer raised a dispute on "${itemTitle}". Payment is frozen. CorperNest admin will contact both parties to resolve this.`,
    link:    "/marketplace/my-listings",
  });

  // Push: confirm to buyer
  await createNotification({
    userId:  txn.buyerId,
    type:    "marketplace-dispute-confirmed",
    title:   "Dispute received 🚨",
    message: `Your dispute on "${itemTitle}" has been received. Payment is frozen. Admin will contact you within 24 hours.`,
    link:    "/marketplace/purchases",
  });

  // Push: notify admin — dispute needs immediate attention
  const [adminUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, "corpernestng@gmail.com"))
    .limit(1);

  if (adminUser) {
    await createNotification({
      userId:  adminUser.id,
      type:    "marketplace-dispute-admin",
      title:   `🚨 Dispute — ${itemTitle}`,
      message: `${buyerUser?.name ?? "Buyer"} (${buyerUser?.phone ?? "—"}) disputes "${itemTitle}". Seller: ${sellerUser?.name ?? "—"} (${sellerUser?.phone ?? "—"}). ${priceStr} frozen. Resolve in admin.`,
      link:    `/admin/marketplace`,
    });
  }

  return NextResponse.json({ success: true });
}