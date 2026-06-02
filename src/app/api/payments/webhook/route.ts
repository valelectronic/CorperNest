// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inspectionPayment, booking, listing } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHmac } from "crypto";
import { createNotification } from "@/lib/create-notification";

export const dynamic = "force-dynamic";

// Paystack retries webhooks if it gets non-200 — always return 200 after validation
// Only throw errors before we've confirmed the signature

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code    = "BK-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  // ── 1. Read raw body for signature verification ───────────────────────────
  // Must read as text — JSON.parse after verification
  const rawBody = await req.text();

  // ── 2. Verify Paystack signature — CRITICAL ───────────────────────────────
  // Paystack signs every webhook with HMAC-SHA512 using your secret key
  // Reject anything that doesn't match — this prevents fake webhook attacks
  const signature = req.headers.get("x-paystack-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const secret        = process.env.PAYSTACK_SECRET_KEY!;
  const expectedSig   = createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    // Do NOT log the signature — could leak security info
    console.error("Webhook signature mismatch — possible fake event");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 3. Parse event ────────────────────────────────────────────────────────
  let event: {
    event: string;
    data: {
      reference:    string;
      amount:       number;
      status:       string;
      customer:     { email: string };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 4. Only handle charge.success — ignore everything else ────────────────
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const { reference, amount, status } = event.data;

  // ── 5. Validate payment status from Paystack ─────────────────────────────
  if (status !== "success") {
    return NextResponse.json({ received: true });
  }

  // ── 6. Validate amount — NEVER trust client amount ───────────────────────
  // Always verify server-side that amount matches expected fee
  if (amount !== 500000) {
    console.error(`Webhook amount mismatch: expected 500000, got ${amount} for ref ${reference}`);
    return NextResponse.json({ received: true }); // Return 200 so Paystack doesn't retry
  }

  // ── 7. Find the inspection payment by reference ───────────────────────────
  const paymentResult = await db
    .select()
    .from(inspectionPayment)
    .where(eq(inspectionPayment.paystackRef, reference))
    .limit(1);

  if (paymentResult.length === 0) {
    // Unknown reference — log and return 200 so Paystack doesn't retry
    console.error(`Webhook: no payment found for reference ${reference}`);
    return NextResponse.json({ received: true });
  }

  const payment = paymentResult[0];

  // ── 8. Idempotency — check if already processed ───────────────────────────
  // Paystack sometimes fires the same webhook twice
  // If payment is already paid, check if booking exists
  if (payment.status === "paid") {
    const existingBooking = await db
      .select({ id: booking.id })
      .from(booking)
      .where(eq(booking.inspectionPaymentId, payment.id))
      .limit(1);

    if (existingBooking.length > 0) {
      // Already processed — return 200 silently
      return NextResponse.json({ received: true });
    }
  }

  // ── 9. Fetch the listing — get first available listing by this agent ───────
  // The corper pays per agent, not per listing
  // We use the listingId stored during initiation via inspectionPayment
  // Since we need a specific listing for the booking, find the one that's available
  const listingResult = await db
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

  // ── 10. Mark inspectionPayment as paid ────────────────────────────────────
  await db
    .update(inspectionPayment)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(inspectionPayment.id, payment.id));

 
  // ── 12. Create booking row ────────────────────────────────────────────────
  if (listingResult.length > 0) {
    const theListing    = listingResult[0];
    const bookingId     = nanoid();
    const bookingCode   = generateBookingCode();

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

    // ── 13. Flip listing to reserved ─────────────────────────────────────────
    await db
      .update(listing)
      .set({ status: "reserved", lastStatusUpdate: new Date(), updatedAt: new Date() })
      .where(eq(listing.id, theListing.id));

    // ── 14. Notify agent ──────────────────────────────────────────────────────
    await createNotification({
      userId:  payment.agentId,
      type:    "booking-created",
      title:   "New Inspection Booked!",
      message: `A corper just paid to inspect your ${theListing.title}. Check your bookings.`,
      link:    "/agent",
    });
  }

  return NextResponse.json({ received: true });
}