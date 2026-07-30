// src/app/api/admin/marketplace/disputes/[id]/resolve/route.ts
// Resolves a dispute — release to seller or refund buyer.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceTransaction, marketplaceListing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id }     = await params;
  const { action } = await req.json();

  if (!["release", "refund"].includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const [txn] = await db
    .select()
    .from(marketplaceTransaction)
    .where(eq(marketplaceTransaction.id, id))
    .limit(1);

  if (!txn) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  if (txn.status !== "disputed") return NextResponse.json({ error: "Transaction is not disputed." }, { status: 400 });

  const [listing] = await db
    .select({ title: marketplaceListing.title })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, txn.listingId))
    .limit(1);

  const itemTitle = listing?.title ?? "the item";
  const payoutStr = `₦${(txn.sellerPayout / 100).toLocaleString("en-NG")}`;
  const amountStr = `₦${(txn.amount / 100).toLocaleString("en-NG")}`;

  if (action === "release") {
    // Release to seller — mark released, listing sold
    await db.update(marketplaceTransaction)
      .set({ status: "released", releasedAt: new Date(), updatedAt: new Date() })
      .where(eq(marketplaceTransaction.id, id));

    await db.update(marketplaceListing)
      .set({ status: "sold", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, txn.listingId));

    await createNotification({
      userId:  txn.sellerId,
      type:    "marketplace-dispute-resolved-seller",
      title:   "Dispute resolved — payout sent 💰",
      message: `The dispute on "${itemTitle}" was resolved in your favour. ${payoutStr} has been transferred to your bank account.`,
      link:    "/marketplace/my-listings",
    });

    await createNotification({
      userId:  txn.buyerId,
      type:    "marketplace-dispute-resolved-buyer",
      title:   "Dispute resolved",
      message: `The dispute on "${itemTitle}" was reviewed by CorperNest admin and resolved in favour of the seller.`,
      link:    "/marketplace/purchases",
    });
  }

  if (action === "refund") {
    // Refund buyer — mark refunded, listing reverts to active
    await db.update(marketplaceTransaction)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(marketplaceTransaction.id, id));

    await db.update(marketplaceListing)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, txn.listingId));

    await createNotification({
      userId:  txn.buyerId,
      type:    "marketplace-dispute-refunded",
      title:   "Dispute resolved — refund initiated 💳",
      message: `The dispute on "${itemTitle}" was resolved in your favour. ${amountStr} will be refunded to your card within 5-7 business days via Paystack.`,
      link:    "/marketplace/purchases",
    });

    await createNotification({
      userId:  txn.sellerId,
      type:    "marketplace-dispute-resolved-seller",
      title:   "Dispute resolved — refund to buyer",
      message: `The dispute on "${itemTitle}" was reviewed by CorperNest admin and resolved in favour of the buyer. The listing is active again.`,
      link:    "/marketplace/my-listings",
    });
  }

  return NextResponse.json({ success: true });
}