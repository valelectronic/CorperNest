import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, listing, user, review } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = session.user as { id: string };

  const rows = await db
    .select({
      id:              booking.id,
      bookingCode:     booking.bookingCode,
      status:          booking.status,
      agreedDate:      booking.agreedDate,
      agreedTime:      booking.agreedTime,
      visitNote:       booking.visitNote,
      createdAt:       booking.createdAt,
      agentId:         booking.agentId,
      listingId:       listing.id,
      listingTitle:    listing.title,
      listingType:     listing.type,
      listingLga:      listing.lga,
      listingState:    listing.state,
      listingPrice:    listing.price,
      listingLandmark: listing.landmark,  // ← landmark shown, not full address
      listingImages:   listing.images,
      agentName:       user.name,
      agentEmail:      user.email,
      agentPhone:      user.phoneNumber,       // ← verified field first
      agentPhoneLegacy: user.phone,            // ← fallback for older accounts
    })
    .from(booking)
    .innerJoin(listing, eq(booking.listingId, listing.id))
    .innerJoin(user, eq(booking.agentId, user.id))
    .where(eq(booking.renterId, currentUser.id))
    .orderBy(desc(booking.createdAt));

  // Check which bookings already have a review
  let reviewedIds = new Set<string>();
  if (rows.length > 0) {
    const bookingIds = rows.map((r) => r.id);
    const reviewRows = await db
      .select({ bookingId: review.bookingId })
      .from(review)
      .where(inArray(review.bookingId, bookingIds));
    reviewedIds = new Set(reviewRows.map((r) => r.bookingId));
  }

  const result = rows.map((row) => ({
    ...row,
    // Agent contact revealed immediately — every booking was admin-approved
    agentPhone:      row.agentPhone ?? row.agentPhoneLegacy ?? null,
    agentEmail:      row.agentEmail,
    // Full address is NEVER sent to client — agent shows it in person.
    // Landmark is enough for the client to know the general area.
    listingAddress:  null,
    hasReview:       reviewedIds.has(row.id),
  }));

  return NextResponse.json({ bookings: result });
}