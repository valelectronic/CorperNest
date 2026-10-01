// src/app/api/parkout/inspections/init-payment/route.ts
// Initializes the ₦3,000 Park-Out inspection payment.
//
// Flow:
// 1. Check user is logged in
// 2. Validate the listing
// 3. Reuse an existing unpaid inspection for the same user/listing
//    or create a new inspection record
// 4. Initialize Paystack payment for ₦3,000
// 5. Return authorizationUrl → client redirects to Paystack
//
// After payment:
// Paystack webhook → parkout_inspection_fee handler
// → confirms payment
// → locks listing for 48 hours
// → notifies incoming tenant

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutInspection, parkoutListing } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://corpernest.com.ng";

const INSPECTION_FEE = 300000; // ₦3,000 in kobo

export async function POST(req: NextRequest) {
  // ── Authentication ────────────────────────────────────────────────────────
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to book an inspection." },
      { status: 401 }
    );
  }

  // ── Validate request ──────────────────────────────────────────────────────
  let body: { listingId?: string; email?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const listingId = body.listingId?.trim();

  if (!listingId) {
    return NextResponse.json(
      { error: "Listing ID is required." },
      { status: 400 }
    );
  }

  // ── Verify listing ────────────────────────────────────────────────────────
  const [listing] = await db
    .select({
      id: parkoutListing.id,
      status: parkoutListing.status,
      moveOutDate: parkoutListing.moveOutDate,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "This listing is no longer available for inspection." },
      { status: 400 }
    );
  }

  if (
    listing.moveOutDate &&
    new Date(listing.moveOutDate).getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: "This listing is no longer available for inspection." },
      { status: 400 }
    );
  }

  // ── Check for an existing inspection ──────────────────────────────────────
  const existingInspections = await db
    .select({
      id: parkoutInspection.id,
      status: parkoutInspection.status,
      paidAt: parkoutInspection.paidAt,
      paystackRef: parkoutInspection.paystackRef,
      lockExpiresAt: parkoutInspection.lockExpiresAt,
    })
    .from(parkoutInspection)
    .where(
      and(
        eq(parkoutInspection.listingId, listingId),
        eq(parkoutInspection.incomingUserId, session.user.id),
        inArray(parkoutInspection.status, ["pending", "confirmed"])
      )
    )
    .limit(1);

  const existingInspection = existingInspections[0];

  // A paid/active inspection already exists.
  if (existingInspection?.paidAt) {
    return NextResponse.json(
      {
        error: "You already have an active inspection for this listing.",
        inspectionId: existingInspection.id,
      },
      { status: 400 }
    );
  }

  // ── Create or reuse inspection record ─────────────────────────────────────
  let inspectionId: string;

  if (existingInspection) {
    inspectionId = existingInspection.id;
  } else {
    inspectionId = `parkout_insp_${nanoid(12)}`;

    await db.insert(parkoutInspection).values({
      id: inspectionId,
      listingId,
      incomingUserId: session.user.id,
      slotNumber: 1,
      bookingFee: INSPECTION_FEE,
      status: "pending",
    });
  }

  // ── Initialize Paystack payment ───────────────────────────────────────────
  const paystackRef = `parkout_insp_${nanoid(12)}`;

  const callbackUrl =
    `${APP_URL}/parkout/listing/${encodeURIComponent(listingId)}` +
    `?payment=success&ref=${encodeURIComponent(paystackRef)}`;

  const paystackRes = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
      body: JSON.stringify({
        email: body.email || session.user.email,
        amount: INSPECTION_FEE,
        reference: paystackRef,
        callback_url: callbackUrl,
        metadata: {
          type: "parkout_inspection_fee",
          listingId,
          inspectionId,
          incomingUserId: session.user.id,
          userName: session.user.name ?? "CorperNest User",
        },
      }),
    }
  );

  const paystackData = await paystackRes.json();

  if (!paystackRes.ok || !paystackData.data?.authorization_url) {
    console.error(
      "[parkout/inspection/init-payment] Paystack error:",
      paystackData
    );

    return NextResponse.json(
      { error: "Could not initialize payment. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    inspectionId,
    reference: paystackRef,
  });
}