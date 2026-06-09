// src/app/api/bookings/send-verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, user, visitVerification } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendOTP } from "@/lib/otp-sender";
import { nanoid } from "nanoid";

function generateVisitCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CNV-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = await req.json();
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  // Find booking — must belong to this agent and be scheduled
  const found = await db
    .select({ id: booking.id, renterId: booking.renterId, status: booking.status })
    .from(booking)
    .where(and(eq(booking.id, bookingId), eq(booking.agentId, session.user.id)))
    .limit(1);

  if (found.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const theBooking = found[0];

  // Must be scheduled (client has set a date)
  if (theBooking.status !== "scheduled") {
    return NextResponse.json(
      { error: "Booking must be scheduled before verification" },
      { status: 400 }
    );
  }

  // Get client details
  const renterResult = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, theBooking.renterId))
    .limit(1);

  if (renterResult.length === 0) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const renter = renterResult[0];

  // Generate visit code
  const code = generateVisitCode();

  // Expires in 2 hours (visit day window)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);

  // Delete any existing unused codes for this booking first
  await db
    .delete(visitVerification)
    .where(and(eq(visitVerification.bookingId, bookingId), eq(visitVerification.used, false)));

  // Store new code
  await db.insert(visitVerification).values({
    id: nanoid(),
    bookingId,
    code,
    expiresAt,
    used: false,
  });

  // Send code to client email
  await sendOTP({ to: renter.email, code, type: "viewing-verification" });

  // Return masked email + the code so agent can see it on screen
  const [localPart, domain] = renter.email.split("@");
  const maskedEmail = `${localPart.charAt(0)}***@${domain}`;

  return NextResponse.json({
    success: true,
    maskedRenterEmail: maskedEmail,
    code, // Agent sees this on screen to verify client reads back correct code
  });
}