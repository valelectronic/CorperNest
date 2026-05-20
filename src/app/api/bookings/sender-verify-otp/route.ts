import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, user, visitVerification } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendOTP } from "@/lib/otp-sender";
import { nanoid } from "nanoid";

// Generates CNV-4F8K2M style code
function generateVisitCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CNV-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  // 1. Check agent is logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  // 2. Find booking — must belong to this agent and be pending
  const found = await db
    .select({
      id: booking.id,
      renterId: booking.renterId,
      status: booking.status,
    })
    .from(booking)
    .where(
      and(
        eq(booking.id, bookingId),
        eq(booking.agentId, session.user.id)
      )
    )
    .limit(1);

  if (found.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const theBooking = found[0];

  if (theBooking.status !== "pending") {
    return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
  }

  // 3. Get renter details
  const renterResult = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, theBooking.renterId))
    .limit(1);

  if (renterResult.length === 0) {
    return NextResponse.json({ error: "Renter not found" }, { status: 404 });
  }

  const renter = renterResult[0];
  // 5. Generate the visit code
  const code = generateVisitCode(); // e.g. CNV-4F8K2M

  // 6. Store in visitVerification table — expires in 20 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 20);

  await db.insert(visitVerification).values({
    id: nanoid(),
    bookingId,
    code,
    expiresAt,
    used: false,
  });

  // 7. Send code to renter 
 await sendOTP({
     to: renter.email, 
     code, 
     type: "viewing-verification" 
    });
  // 8. Return masked renter email for dashboard display
  const [localPart, domain] = renter.email.split("@");
  const maskedEmail = `${localPart.charAt(0)}***@${domain}`;

  return NextResponse.json({
    success: true,
    maskedRenterEmail: maskedEmail,
  });
}