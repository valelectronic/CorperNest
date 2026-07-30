// src/app/api/admin/marketplace/transactions/[id]/cancel/route.ts
// Admin cancels a pending transaction — listing reverts to active.
// Used when buyer started checkout but never completed and admin needs to clear it.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceTransaction, marketplaceListing } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    .select({ id: marketplaceTransaction.id, status: marketplaceTransaction.status, listingId: marketplaceTransaction.listingId })
    .from(marketplaceTransaction)
    .where(eq(marketplaceTransaction.id, id))
    .limit(1);

  if (!txn) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });

  if (txn.status !== "pending") {
    return NextResponse.json({ error: "Only pending transactions can be cancelled." }, { status: 400 });
  }

  // Cancel transaction
  await db.update(marketplaceTransaction)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(marketplaceTransaction.id, id));

  // Revert listing to active
  await db.update(marketplaceListing)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(marketplaceListing.id, txn.listingId));

  return NextResponse.json({ success: true });
}