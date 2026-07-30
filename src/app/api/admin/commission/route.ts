// src/app/api/admin/commission/route.ts
// Admin-only commission management.
// GET: returns paid and pending commission bookings.
// POST: marks a booking commission as paid.
// Amount is not stored — agents transfer directly to bank account.
// Tracking is by count and which property/agent each payment relates to.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com";

// ── GET — fetch commission summary ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)                     return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Admin only."   }, { status: 403 });

  const [paid, pending] = await Promise.all([

    // Paid commissions — agent has transferred
    db.select({
      id:              booking.id,
      bookingCode:     booking.bookingCode,
      commissionPaidAt: booking.commissionPaidAt,
      agentName:       user.name,
      agentPhone:      user.phoneNumber,
      listingTitle:    listing.title,
      listingAddress:  listing.address,
    })
    .from(booking)
    .innerJoin(user,    eq(booking.agentId,   user.id))
    .innerJoin(listing, eq(booking.listingId, listing.id))
    .where(eq(booking.commissionStatus, "paid")),

    // Pending — commission requested but not yet confirmed received
    db.select({
      id:           booking.id,
      bookingCode:  booking.bookingCode,
      agentName:    user.name,
      agentPhone:   user.phoneNumber,
      listingTitle: listing.title,
      listingAddress: listing.address,
      createdAt:    booking.createdAt,
    })
    .from(booking)
    .innerJoin(user,    eq(booking.agentId,   user.id))
    .innerJoin(listing, eq(booking.listingId, listing.id))
    .where(eq(booking.commissionStatus, "requested")),
  ]);

  return NextResponse.json({
    paidCount:    paid.length,
    pendingCount: pending.length,
    paid,
    pending,
  });
}

// ── POST — mark commission as paid ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)                     return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Admin only."   }, { status: 403 });

  const { bookingId } = await req.json();
  if (!bookingId) return NextResponse.json({ error: "Booking ID required." }, { status: 400 });

  const [found] = await db
    .select({ id: booking.id })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!found) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  await db
    .update(booking)
    .set({
      commissionStatus: "paid",
      commissionPaidAt: new Date(),
      updatedAt:        new Date(),
    })
    .where(eq(booking.id, bookingId));

  return NextResponse.json({ success: true });
}