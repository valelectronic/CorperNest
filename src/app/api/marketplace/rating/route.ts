// src/app/api/marketplace/ratings/route.ts
// Buyer submits a rating for the seller after confirming receipt.
// One rating per transaction only — enforced by unique index.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceRating, marketplaceTransaction } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function generateId() {
  return `rat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { transactionId, stars, comment } = await req.json();

  if (!transactionId) return NextResponse.json({ error: "Transaction ID required." }, { status: 400 });
  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Stars must be between 1 and 5." }, { status: 400 });
  }

  // Verify this transaction belongs to this buyer and is released
  const [txn] = await db
    .select({
      id:        marketplaceTransaction.id,
      buyerId:   marketplaceTransaction.buyerId,
      sellerId:  marketplaceTransaction.sellerId,
      listingId: marketplaceTransaction.listingId,
      status:    marketplaceTransaction.status,
    })
    .from(marketplaceTransaction)
    .where(and(
      eq(marketplaceTransaction.id, transactionId),
      eq(marketplaceTransaction.buyerId, session.user.id),
    ))
    .limit(1);

  if (!txn) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  if (txn.status !== "released") {
    return NextResponse.json({ error: "You can only rate after the transaction is complete." }, { status: 409 });
  }

  // Insert rating — unique index prevents duplicates silently
  try {
    await db.insert(marketplaceRating).values({
      id:            generateId(),
      transactionId,
      listingId:     txn.listingId,
      sellerId:      txn.sellerId,
      buyerId:       session.user.id,
      stars,
      comment:       comment?.trim() || null,
      createdAt:     new Date(),
    });
  } catch {
    // Unique constraint — already rated, silent success
    return NextResponse.json({ success: true, alreadyRated: true });
  }

  return NextResponse.json({ success: true });
}

// GET — fetch seller rating summary (used on listing cards and detail pages)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get("sellerId");
  if (!sellerId) return NextResponse.json({ error: "sellerId required." }, { status: 400 });

  const ratings = await db
    .select({ stars: marketplaceRating.stars })
    .from(marketplaceRating)
    .where(eq(marketplaceRating.sellerId, sellerId));

  if (ratings.length === 0) {
    return NextResponse.json({ totalRatings: 0, average: null, isNew: true });
  }

  const average = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;

  return NextResponse.json({
    totalRatings: ratings.length,
    average:      Math.round(average * 10) / 10,
    isNew:        false,
  });
}