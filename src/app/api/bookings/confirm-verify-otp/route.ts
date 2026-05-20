import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, visitVerification } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  // 1. Check agent is logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, code } = await req.json();

  if (!bookingId || !code) {
    return NextResponse.json({ error: "bookingId and code are required" }, { status: 400 });
  }

  // 2. Find the visit verification record
  const record = await db
    .select()
    .from(visitVerification)
    .where(
      and(
        eq(visitVerification.bookingId, bookingId),
        eq(visitVerification.code, code.toUpperCase().trim()),
        eq(visitVerification.used, false)
      )
    )
    .limit(1);

  if (record.length === 0) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const verification = record[0];

  // 3. Check if code has expired
  if (new Date() > new Date(verification.expiresAt)) {
    return NextResponse.json({ error: "Code has expired. Request a new one." }, { status: 400 });
  }

  // 4. Confirm booking belongs to this agent
  const theBooking = await db
    .select({ id: booking.id, status: booking.status })
    .from(booking)
    .where(
      and(
        eq(booking.id, bookingId),
        eq(booking.agentId, session.user.id)
      )
    )
    .limit(1);

  if (theBooking.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (theBooking[0].status !== "pending") {
    return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
  }

  // 5. Mark verification code as used
  await db
    .update(visitVerification)
    .set({ used: true })
    .where(eq(visitVerification.id, verification.id));

  // 6. Mark booking as verified
  await db
    .update(booking)
    .set({
      status: "verified",
      updatedAt: new Date(),
    })
    .where(eq(booking.id, bookingId));

  return NextResponse.json({ success: true });
}