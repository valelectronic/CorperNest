// src/app/api/marketplace/checkout/verify/route.ts
// Called by the checkout success page to confirm payment landed.
// Checks marketplaceTransaction.status — webhook already did the real work.
// Just reads the DB to confirm webhook processed it before showing success.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketplaceTransaction } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ paid: false });

  const reference = new URL(req.url).searchParams.get("reference");
  if (!reference) return NextResponse.json({ paid: false });

  const [txn] = await db
    .select({ status: marketplaceTransaction.status, buyerId: marketplaceTransaction.buyerId })
    .from(marketplaceTransaction)
    .where(eq(marketplaceTransaction.paystackRef, reference))
    .limit(1);

  if (!txn || txn.buyerId !== session.user.id) {
    return NextResponse.json({ paid: false });
  }

  return NextResponse.json({ paid: txn.status === "escrow" || txn.status === "released" });
}