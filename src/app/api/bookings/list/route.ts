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

  const currentUser = session.user as {
    id:   string;
    role?: string | null;
  };

  const isAgent = currentUser.role === "agent";

  // ── AGENT: fetch bookings where agentId = me ──────────────────────────────
  if (isAgent) {
    const rows = await db
      .select({
        // Booking core
        id:            booking.id,
        bookingCode:   booking.bookingCode,
        status:        booking.status,
        agreedDate:    booking.agreedDate,
        agreedTime:    booking.agreedTime,
        visitNote:     booking.visitNote,
        createdAt:     booking.createdAt,
        // Listing info
        listingId:     listing.id,
        listingTitle:  listing.title,
        listingType:   listing.type,
        listingLga:    listing.lga,
        listingState:  listing.state,
        listingPrice:  listing.price,
        listingAddress: listing.address,
        listingImages: listing.images,
        // Corper info — revealed always for agent after scheduled
        renterName:    user.name,
        renterPhone:   user.phone,
        renterEmail:   user.email,
      })
      .from(booking)
      .innerJoin(listing, eq(booking.listingId, listing.id))
      .innerJoin(user, eq(booking.renterId, user.id))
      .where(eq(booking.agentId, currentUser.id))
      .orderBy(desc(booking.createdAt));

    return NextResponse.json({ bookings: rows, role: "agent" });
  }

  // ── CORPER: fetch bookings where renterId = me ────────────────────────────
  // We need agent info too — but agent phone/contact only revealed after scheduled
  // We do two separate selects to avoid complex aliasing with a single join
  const rows = await db
    .select({
      // Booking core
      id:            booking.id,
      bookingCode:   booking.bookingCode,
      status:        booking.status,
      agreedDate:    booking.agreedDate,
      agreedTime:    booking.agreedTime,
      visitNote:     booking.visitNote,
      createdAt:     booking.createdAt,
      agentId:       booking.agentId,
      // Listing info
      listingId:     listing.id,
      listingTitle:  listing.title,
      listingType:   listing.type,
      listingLga:    listing.lga,
      listingState:  listing.state,
      listingPrice:  listing.price,
      listingAddress: listing.address,
      listingImages: listing.images,
      // Agent info — revealed after scheduled
      agentName:     user.name,
      agentPhone:    user.phone,
    })
    .from(booking)
    .innerJoin(listing, eq(booking.listingId, listing.id))
    .innerJoin(user, eq(booking.agentId, user.id))
    .where(eq(booking.renterId, currentUser.id))
    .orderBy(desc(booking.createdAt));

  // Mask agent phone until status is scheduled
  const masked = rows.map((row) => ({
    ...row,
    agentPhone:    row.status === "pending" ? null : row.agentPhone,
    listingAddress: row.status === "pending" ? null : row.listingAddress,
  }));

  return NextResponse.json({ bookings: masked, role: "corper" });
}