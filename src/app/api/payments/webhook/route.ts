// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inspectionPayment, booking, listing, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHmac } from "crypto";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

export const dynamic = "force-dynamic";

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code    = "BK-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const secret      = process.env.PAYSTACK_SECRET_KEY!;
  const expectedSig = createHmac("sha512", secret).update(rawBody).digest("hex");

  if (signature !== expectedSig) {
    console.error("Webhook signature mismatch — possible fake event");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event: string;
    data: { reference: string; amount: number; status: string; customer: { email: string } };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const { reference, amount, status } = event.data;

  if (status !== "success") {
    return NextResponse.json({ received: true });
  }

  if (amount !== 500000) {
    console.error(`Webhook amount mismatch: expected 500000, got ${amount} for ref ${reference}`);
    return NextResponse.json({ received: true });
  }

  const paymentResult = await db
    .select()
    .from(inspectionPayment)
    .where(eq(inspectionPayment.paystackRef, reference))
    .limit(1);

  if (paymentResult.length === 0) {
    console.error(`Webhook: no payment found for reference ${reference}`);
    return NextResponse.json({ received: true });
  }

  const payment = paymentResult[0];

  if (payment.status === "paid") {
    const existingBooking = await db
      .select({ id: booking.id })
      .from(booking)
      .where(eq(booking.inspectionPaymentId, payment.id))
      .limit(1);

    if (existingBooking.length > 0) {
      return NextResponse.json({ received: true });
    }
  }

  // ── Find the listing to book ───────────────────────────────────────────────
  // Use the SPECIFIC listing the renter actually clicked from, since that's
  // now stored on the payment record. Falls back to the old "any available
  // listing by this agent" behavior ONLY for payments created before this
  // fix shipped (where listingId would be null).
  let listingResult: { id: string; title: string; agentId: string }[];

  if (payment.listingId) {
    listingResult = await db
      .select({ id: listing.id, title: listing.title, agentId: listing.agentId })
      .from(listing)
      .where(eq(listing.id, payment.listingId))
      .limit(1);
  } else {
    listingResult = await db
      .select({ id: listing.id, title: listing.title, agentId: listing.agentId })
      .from(listing)
      .where(
        and(
          eq(listing.agentId, payment.agentId),
          eq(listing.status, "available"),
          eq(listing.isActive, true)
        )
      )
      .limit(1);
  }

  await db
    .update(inspectionPayment)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(inspectionPayment.id, payment.id));

  if (listingResult.length > 0) {
    const theListing  = listingResult[0];
    const bookingId   = nanoid();
    const bookingCode = generateBookingCode();

    await db.insert(booking).values({
      id:                   bookingId,
      listingId:            theListing.id,
      renterId:             payment.renterId,
      agentId:              payment.agentId,
      inspectionPaymentId:  payment.id,
      bookingCode,
      renterContact:        event.data.customer.email,
      renterContactType:    "email",
      status:               "pending",
      confirmationStatus:   "pending",
      createdAt:            new Date(),
      updatedAt:            new Date(),
    });

    await db
      .update(listing)
      .set({ status: "reserved", lastStatusUpdate: new Date(), updatedAt: new Date() })
      .where(eq(listing.id, theListing.id));

    await createNotification({
      userId:  payment.agentId,
      type:    "booking-created",
      title:   "New Inspection Booked!",
      message: `A corper just paid to inspect your ${theListing.title}. Check your bookings.`,
      link:    "/agent",
    });

    // ── Fetch both parties' contact info — this is what actually lets
    // admin pick up the phone and call either of them directly
    const [agentRow, renterRow] = await Promise.all([
      db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
        .from(user).where(eq(user.id, payment.agentId)).limit(1),
      db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
        .from(user).where(eq(user.id, payment.renterId)).limit(1),
    ]);
    const agentPhone  = agentRow[0]?.phoneNumber ?? agentRow[0]?.phone ?? "Not provided";
    const renterPhone = renterRow[0]?.phoneNumber ?? renterRow[0]?.phone ?? "Not provided";

    await sendAdminEmail(
      `New Booking — ${bookingCode}`,
      `
        <h2>New Inspection Booking</h2>
        <table cellpadding="6">
          <tr><td><b>Booking Code</b></td><td>${bookingCode}</td></tr>
          <tr><td><b>Renter Name</b></td><td>${renterRow[0]?.name ?? "Unknown"}</td></tr>
          <tr><td><b>Renter Phone</b></td><td>${renterPhone}</td></tr>
          <tr><td><b>Renter Email</b></td><td>${event.data.customer.email}</td></tr>
          <tr><td><b>Agent Name</b></td><td>${agentRow[0]?.name ?? "Unknown"}</td></tr>
          <tr><td><b>Agent Phone</b></td><td>${agentPhone}</td></tr>
          <tr><td><b>Listing</b></td><td>${theListing.title}</td></tr>
          <tr><td><b>Amount Paid</b></td><td>₦5,000</td></tr>
          <tr><td><b>Time</b></td><td>${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</td></tr>
        </table>
        <p><a href="https://www.corpernest.com.ng/admin/bookings">View on Admin Dashboard →</a></p>
      `
    );
  }

  return NextResponse.json({ received: true });
}