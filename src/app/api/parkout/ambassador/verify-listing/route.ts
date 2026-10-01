// src/app/api/parkout/ambassador/verify-listing/route.ts
// Ambassador marks a listing as verified after calling the caretaker.
// Sets verifiedByAmbassador = true on the listing.
// Admin can see this in the listing detail.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing, parkoutAmbassador } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";
import { user } from "@/db/schema";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Listing ID required." }, { status: 400 });

  // Confirm user is an active ambassador
  const [ambassador] = await db
    .select({ id: parkoutAmbassador.id, lga: parkoutAmbassador.lga })
    .from(parkoutAmbassador)
    .where(and(
      eq(parkoutAmbassador.userId, session.user.id),
      eq(parkoutAmbassador.isActive, true),
    ))
    .limit(1);

  if (!ambassador) {
    return NextResponse.json({ error: "Active ambassador account required." }, { status: 403 });
  }

  // Confirm listing is assigned to this ambassador
  const [listing] = await db
    .select({ id: parkoutListing.id, title: parkoutListing.title, lga: parkoutListing.lga })
    .from(parkoutListing)
    .where(and(
      eq(parkoutListing.id, listingId),
      eq(parkoutListing.ambassadorId, ambassador.id),
    ))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found or not assigned to you." }, { status: 404 });
  }

  // Mark as verified
  await db.update(parkoutListing)
    .set({
      verifiedByAmbassador: true,
      verifiedAt:           new Date(),
      updatedAt:            new Date(),
    })
    .where(eq(parkoutListing.id, listingId));

  // Notify admin
  const [adminUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL))
    .limit(1);

  if (adminUser) {
    await createNotification({
      userId:  adminUser.id,
      type:    "parkout-listing-verified",
      title:   "Listing verified by ambassador ✓",
      message: `${session.user.name} has verified the listing "${listing.title}" in ${listing.lga}.`,
      link:    `/admin/parkout/listings/${listingId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}