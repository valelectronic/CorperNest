// src/app/api/marketplace/transactions/[id]/waybill/route.ts
// Seller submits waybill details after shipping an item.
// Updates the transaction and notifies the buyer.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceTransaction, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {sendPushToUser } from "@/lib/fcm-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const { waybillDetails } = await req.json();

  if (!waybillDetails?.trim()) {
    return NextResponse.json({ error: "Waybill details are required." }, { status: 400 });
  }

  // Verify this transaction belongs to this seller and is in escrow
  const [txn] = await db
    .select({
      id:       marketplaceTransaction.id,
      buyerId:  marketplaceTransaction.buyerId,
      sellerId: marketplaceTransaction.sellerId,
      status:   marketplaceTransaction.status,
      listingId: marketplaceTransaction.listingId,
    })
    .from(marketplaceTransaction)
    .where(and(
      eq(marketplaceTransaction.id, id),
      eq(marketplaceTransaction.sellerId, session.user.id),
    ))
    .limit(1);

  if (!txn) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  if (txn.status !== "escrow") {
    return NextResponse.json({ error: "Can only add waybill to active escrow transactions." }, { status: 409 });
  }

  // Save waybill details
  await db
    .update(marketplaceTransaction)
    .set({
      waybillDetails: waybillDetails.trim(),
      shippedAt:      new Date(),
      updatedAt:      new Date(),
    })
    .where(eq(marketplaceTransaction.id, id));

  // Notify buyer that item has been shipped
  await sendPushToUser({
  userId: txn.buyerId,
  title:  "Your item has been shipped 📦",
  body:   "The seller has provided shipping details. Check your purchases page for tracking info.",
  link:   "/marketplace/purchases",
}).catch(() => {});

  return NextResponse.json({ success: true });
}