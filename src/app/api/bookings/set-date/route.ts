// src/app/api/bookings/set-date/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, listing, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { bookingId, agreedDate, agreedTime } = body as {
    bookingId:  string;
    agreedDate: string; // ISO date string e.g. "2025-06-15"
    agreedTime: string; // e.g. "2:00 PM"
  };

  if (!bookingId || !agreedDate || !agreedTime) {
    return NextResponse.json(
      { error: "bookingId, agreedDate and agreedTime are required" },
      { status: 400 }
    );
  }

  // 1. Fetch booking — must belong to this corper and be pending
  const found = await db
    .select({
      id:        booking.id,
      agentId:   booking.agentId,
      listingId: booking.listingId,
      status:    booking.status,
    })
    .from(booking)
    .where(
      and(
        eq(booking.id, bookingId),
        eq(booking.renterId, session.user.id)
      )
    )
    .limit(1);

  if (found.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const theBooking = found[0];

  if (theBooking.status !== "pending") {
    return NextResponse.json(
      { error: "Date has already been set for this booking" },
      { status: 400 }
    );
  }

  // 2. Fetch listing title for notification message
  const listingResult = await db
    .select({ title: listing.title })
    .from(listing)
    .where(eq(listing.id, theBooking.listingId))
    .limit(1);

  const listingTitle = listingResult[0]?.title ?? "the property";

  // 3. Fetch corper name for notification message
  const corperResult = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const corperName = corperResult[0]?.name ?? "A corper";

  // 4. Flip status to scheduled + save date/time
  await db
    .update(booking)
    .set({
      status:      "scheduled",
      agreedDate:  new Date(agreedDate),
      agreedTime,
      updatedAt:   new Date(),
    })
    .where(eq(booking.id, bookingId));

  // 5. Notify agent — contacts are now revealed on both sides
  await createNotification({
    userId:  theBooking.agentId,
    type:    "date-proposed",
    title:   "Inspection Scheduled",
    message: `${corperName} scheduled an inspection of your ${listingTitle} — check your bookings for their contact details.`,
    link:    `/bookings`,
  });

  return NextResponse.json({ success: true });
}