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
      id:             booking.id,
      bookingCode:    booking.bookingCode,
      status:         booking.status,
      agreedDate:     booking.agreedDate,
      agreedTime:     booking.agreedTime,
      visitNote:      booking.visitNote,
      createdAt:      booking.createdAt,
      agentId:        booking.agentId,
      listingId:      listing.id,
      listingTitle:   listing.title,
      listingType:    listing.type,
      listingLga:     listing.lga,
      listingState:   listing.state,
      listingPrice:   listing.price,
      listingAddress: listing.address,
      listingImages:  listing.images,
      agentName:      user.name,
      agentPhone:     user.phone,
    })
    .from(booking)
    .innerJoin(listing, eq(booking.listingId, listing.id))
    .innerJoin(user, eq(booking.agentId, user.id))
    .where(eq(booking.renterId, currentUser.id))
    .orderBy(desc(booking.createdAt));

  // Check which bookings already have a review from this client
  let reviewedIds = new Set<string>();
  if (rows.length > 0) {
    const bookingIds  = rows.map((r) => r.id);
    const reviewRows  = await db
      .select({ bookingId: review.bookingId })
      .from(review)
      .where(inArray(review.bookingId, bookingIds));
    reviewedIds = new Set(reviewRows.map((r) => r.bookingId));
  }

  const masked = rows.map((row) => ({
    ...row,
    agentPhone:     row.status === "pending" ? null : row.agentPhone,
    listingAddress: row.status === "pending" ? null : row.listingAddress,
    hasReview:      reviewedIds.has(row.id),
  }));

  return NextResponse.json({ bookings: masked });
}