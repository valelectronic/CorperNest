// src/app/api/bookings/list/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, listing, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = session.user as { id: string };

  // ALWAYS fetch as renter — role is irrelevant here.
  // Agent incoming bookings are handled separately in agent/page.tsx.
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

  const masked = rows.map((row) => ({
    ...row,
    agentPhone:     row.status === "pending" ? null : row.agentPhone,
    listingAddress: row.status === "pending" ? null : row.listingAddress,
  }));

  return NextResponse.json({ bookings: masked });
}