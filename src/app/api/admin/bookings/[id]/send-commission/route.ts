// src/app/api/admin/bookings/[id]/send-commission/route.ts
//
// Admin manually triggers commission request after a visit is confirmed.
// Works for BOTH pending and verified bookings — admin can override
// when agent confirms visit but client never tapped the button.
// Only blocked if commission is already paid.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: bookingId } = await params;

  const [found] = await db
    .select({
      id:               booking.id,
      status:           booking.status,
      agentId:          booking.agentId,
      listingId:        booking.listingId,
      commissionStatus: booking.commissionStatus,
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!found) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only block if commission is already paid
  // Status check removed — admin can send commission for pending bookings too
  if (found.commissionStatus === "paid") {
    return NextResponse.json({ error: "Commission already paid" }, { status: 409 });
  }

  const [listingRow] = await db
    .select({ title: listing.title })
    .from(listing)
    .where(eq(listing.id, found.listingId))
    .limit(1);

  // Mark commission as requested
  await db
    .update(booking)
    .set({ commissionStatus: "requested", updatedAt: new Date() })
    .where(eq(booking.id, bookingId));

  // Notify agent — they'll see the payment card on their dashboard
  await createNotification({
    userId:  found.agentId,
    type:    "commission-request",
    title:   "Commission payment due",
    message: `Your CorperNest commission of ₦1,000 for ${listingRow?.title ?? "a listing"} is now due. Pay from your dashboard.`,
    link:    "/agent",
  });

  return NextResponse.json({ success: true });
}