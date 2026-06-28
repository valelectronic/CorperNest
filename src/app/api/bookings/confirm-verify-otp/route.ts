// src/app/api/bookings/confirm-verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, visitVerification, inspectionPayment, listing, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendAdminEmail } from "@/lib/send-admin-email";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, code } = await req.json();
  if (!bookingId || !code) {
    return NextResponse.json({ error: "bookingId and code are required" }, { status: 400 });
  }

  // Find verification record
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

  if (new Date() > new Date(verification.expiresAt)) {
    return NextResponse.json({ error: "Code has expired. Send a new one." }, { status: 400 });
  }

  // Confirm booking belongs to this agent and is scheduled — now also
  // pulling renterId, since we need it to fetch the renter's phone below
  const theBooking = await db
    .select({
      id: booking.id, status: booking.status, listingId: booking.listingId,
      inspectionPaymentId: booking.inspectionPaymentId, bookingCode: booking.bookingCode,
      renterId: booking.renterId,
    })
    .from(booking)
    .where(and(eq(booking.id, bookingId), eq(booking.agentId, session.user.id)))
    .limit(1);

  if (theBooking.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (theBooking[0].status !== "scheduled") {
    return NextResponse.json({ error: "Booking is not in scheduled status" }, { status: 400 });
  }

  // Mark verification code as used
  await db
    .update(visitVerification)
    .set({ used: true })
    .where(eq(visitVerification.id, verification.id));

  // Mark booking as verified
  await db
    .update(booking)
    .set({ status: "verified", updatedAt: new Date() })
    .where(eq(booking.id, bookingId));

  // Expire the inspection payment
  if (theBooking[0].inspectionPaymentId) {
    await db
      .update(inspectionPayment)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(inspectionPayment.id, theBooking[0].inspectionPaymentId));
  }

  // ── Fetch real names + both phone numbers, plus the listing title —
  // the old email only showed a raw Agent ID, not even a readable name
  const [agentRow, renterRow, listingRow] = await Promise.all([
    db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
      .from(user).where(eq(user.id, session.user.id)).limit(1),
    db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
      .from(user).where(eq(user.id, theBooking[0].renterId)).limit(1),
    db.select({ title: listing.title })
      .from(listing).where(eq(listing.id, theBooking[0].listingId)).limit(1),
  ]);

  const agentPhone  = agentRow[0]?.phoneNumber ?? agentRow[0]?.phone ?? "Not provided";
  const renterPhone = renterRow[0]?.phoneNumber ?? renterRow[0]?.phone ?? "Not provided";

  // Admin email — visit confirmed, payout now owed
  await sendAdminEmail(
    `Visit Confirmed — ${theBooking[0].bookingCode}`,
    `
      <h2>Inspection Visit Confirmed</h2>
      <p>The agent has confirmed the client visited and read back the correct CNV code.</p>
      <table cellpadding="6">
        <tr><td><b>Booking Code</b></td><td>${theBooking[0].bookingCode}</td></tr>
        <tr><td><b>Listing</b></td><td>${listingRow[0]?.title ?? "Unknown"}</td></tr>
        <tr><td><b>Agent Name</b></td><td>${agentRow[0]?.name ?? "Unknown"}</td></tr>
        <tr><td><b>Agent Phone</b></td><td>${agentPhone}</td></tr>
        <tr><td><b>Renter Name</b></td><td>${renterRow[0]?.name ?? "Unknown"}</td></tr>
        <tr><td><b>Renter Phone</b></td><td>${renterPhone}</td></tr>
        <tr><td><b>Confirmed At</b></td><td>${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</td></tr>
      </table>
      <p><b>Action required: agent payout is now owed.</b></p>
      <p><a href="https://www.corpernest.com.ng/admin/payments">View Payouts →</a></p>
    `
  );

  return NextResponse.json({ success: true });
}