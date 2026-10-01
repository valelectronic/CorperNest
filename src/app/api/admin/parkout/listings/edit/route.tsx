// src/app/api/admin/parkout/listings/edit/route.ts
// Admin edits a listing — move-out date and annual rent only.
// Recalculates commission splits when rent changes.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId, moveOutDate, annualRent } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Listing ID required." }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (moveOutDate) {
    const d = new Date(moveOutDate);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid move-out date." }, { status: 400 });
    updates.moveOutDate = d;
  }

  if (annualRent) {
    const rentKobo           = Math.round(Number(annualRent) * 100);
    const facilitationFee    = Math.round(rentKobo * 0.10);
    const outgoingCommission = Math.round(facilitationFee * 0.60);
    const ambassadorCommission = Math.round(facilitationFee * 0.25);
    const platformRevenue    = Math.round(facilitationFee * 0.15);

    updates.annualRent          = rentKobo;
    updates.facilitationFee     = facilitationFee;
    updates.outgoingCommission  = outgoingCommission;
    updates.ambassadorCommission = ambassadorCommission;
    updates.platformRevenue     = platformRevenue;
  }

  await db.update(parkoutListing)
    .set(updates)
    .where(eq(parkoutListing.id, listingId));

  return NextResponse.json({ success: true });
}