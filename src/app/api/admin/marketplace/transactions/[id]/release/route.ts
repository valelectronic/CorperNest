// src/app/api/admin/marketplace/transactions/[id]/release/route.ts
// Marks a transaction as released after admin sends payout to seller.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceTransaction, marketplaceListing, user } from "@/db/schema";
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

  const { id } = await params;

  const [txn] = await db
    .select()
    .from(marketplaceTransaction)
    .where(eq(marketplaceTransaction.id, id))
    .limit(1);

  if (!txn) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  if (txn.status !== "escrow") return NextResponse.json({ error: "Transaction is not in escrow." }, { status: 400 });

  await db.update(marketplaceTransaction)
    .set({ status: "released", releasedAt: new Date(), updatedAt: new Date() })
    .where(eq(marketplaceTransaction.id, id));

  await db.update(marketplaceListing)
    .set({ status: "sold", updatedAt: new Date() })
    .where(eq(marketplaceListing.id, txn.listingId));

  const [listing] = await db
    .select({ title: marketplaceListing.title })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, txn.listingId))
    .limit(1);

  const payoutStr = `₦${(txn.sellerPayout / 100).toLocaleString("en-NG")}`;

  await createNotification({
    userId:  txn.sellerId,
    type:    "marketplace-payout-sent",
    title:   "Your payout has been sent 💰",
    message: `${payoutStr} for "${listing?.title ?? "your item"}" has been transferred to your bank account.`,
    link:    "/marketplace/my-listings",
  });

  return NextResponse.json({ success: true });
}