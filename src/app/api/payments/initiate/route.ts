// src/app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { inspectionPayment, listing, booking } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createNotification } from "@/lib/create-notification";

export const dynamic = "force-dynamic";

// Simple in-memory rate limit — max 3 initiation attempts per IP per minute
// Resets on server restart — good enough for Vercel serverless (short-lived)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now    = Date.now();
  const entry  = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  if (entry.count >= 3) return true;

  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  // ── 1. Rate limit by IP ───────────────────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  // ── 2. Auth — always read from session, never trust client ────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const renterId    = session.user.id;
  const renterEmail = session.user.email;
  const renterName  = session.user.name;

  // ── 3. Validate request body ──────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  if (!body?.listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const { listingId } = body as { listingId: string };

  // ── 4. Fetch listing — must be active and available ───────────────────────
  const listingResult = await db
    .select({ id: listing.id, agentId: listing.agentId, status: listing.status, title: listing.title })
    .from(listing)
    .where(and(eq(listing.id, listingId), eq(listing.isActive, true)))
    .limit(1);

  if (listingResult.length === 0) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const theListing = listingResult[0];

  if (theListing.status !== "available") {
    return NextResponse.json(
      { error: "This property is no longer available for booking" },
      { status: 400 }
    );
  }

  // Corper cannot book their own listing
  if (theListing.agentId === renterId) {
    return NextResponse.json({ error: "You cannot book your own listing" }, { status: 400 });
  }

  const agentId = theListing.agentId;

  // ── 5. Idempotency — check for existing pending/paid payment ──────────────
  // One fee covers ALL listings by the same agent
  // If corper already paid for this agent, no second charge
  const existing = await db
    .select({ id: inspectionPayment.id, status: inspectionPayment.status })
    .from(inspectionPayment)
    .where(
      and(
        eq(inspectionPayment.renterId, renterId),
        eq(inspectionPayment.agentId, agentId)
      )
    )
    .limit(1);

  if (existing.length > 0 && existing[0].status === "paid") {
    // Already paid this agent — no new payment needed. Create the booking
    // for THIS listing directly under the existing payment, instead of
    // blocking. This is what makes "tour all properties by this agent"
    // actually work when they want to visit a second one later.

    // Prevent a duplicate booking if they've already booked this exact listing
    const existingBookingForThisListing = await db
      .select({ id: booking.id })
      .from(booking)
      .where(
        and(
          eq(booking.renterId, renterId),
          eq(booking.listingId, listingId),
        )
      )
      .limit(1);

    if (existingBookingForThisListing.length > 0) {
      return NextResponse.json(
        { error: "You've already booked this property." },
        { status: 400 }
      );
    }

    const bookingId   = nanoid();
    const bookingCode = `BK-${nanoid(6).toUpperCase()}`;

    await db.insert(booking).values({
      id:                  bookingId,
      listingId,
      renterId,
      agentId,
      inspectionPaymentId: existing[0].id,
      bookingCode,
      renterContact:       renterEmail,
      renterContactType:   "email",
      status:              "pending",
      confirmationStatus:  "pending",
      createdAt:           new Date(),
      updatedAt:           new Date(),
    });

    await db
      .update(listing)
      .set({ status: "reserved", lastStatusUpdate: new Date(), updatedAt: new Date() })
      .where(eq(listing.id, listingId));

    await createNotification({
      userId:  agentId,
      type:    "booking-created",
      title:   "New Inspection Booked!",
      message: `A corper wants to inspect your ${theListing.title} too — already paid, no new charge.`,
      link:    "/agent",
    });

    return NextResponse.json({
      alreadyPaid: true,
      bookingId,
    });
  }

  // ── 6. Generate Paystack reference ───────────────────────────────────────
  const paystackRef = `CN-${nanoid(12).toUpperCase()}`;

  // ── 7. Create inspectionPayment row (pending) ─────────────────────────────
  const paymentId = nanoid();
  await db.insert(inspectionPayment).values({
    id:          paymentId,
    renterId,
    agentId,
    listingId,   // ← which specific listing triggered this payment — this is
                 //   what lets the webhook book the EXACT property the
                 //   renter clicked from, instead of guessing
    paystackRef,
    amount:      500000, // ₦5,000 in kobo
    status:      "pending",
    createdAt:   new Date(),
    updatedAt:   new Date(),
  });

  // ── 8. Initialize Paystack transaction ───────────────────────────────────
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/properties/${listingId}?payment=success&ref=${paystackRef}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      email:        renterEmail,
      amount:       500000,
      reference:    paystackRef,
      callback_url: callbackUrl,
      metadata: {
        custom_fields: [
          { display_name: "Corper Name",  variable_name: "corper_name",  value: renterName },
          { display_name: "Listing",      variable_name: "listing_title", value: theListing.title },
          { display_name: "Payment ID",   variable_name: "payment_id",   value: paymentId },
        ],
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackRes.ok || !paystackData.status) {
    // Clean up the pending payment row if Paystack init failed
    await db.delete(inspectionPayment).where(eq(inspectionPayment.id, paymentId));
    return NextResponse.json(
      { error: "Could not initialize payment. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference:        paystackRef,
  });
}