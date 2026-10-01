// src/app/api/parkout/booking/[listingid]/initialize/route.ts
// Initializes the ₦3,000 inspection fee payment via Paystack.
//
// The inspection fee belongs entirely to CorperNest.
// There is NO Paystack split on this payment.
//
// Called from inspection-client.tsx when the user taps
// "Pay ₦3,000 to Book Inspection".
//
// Flow:
// 1. Authenticates the incoming tenant.
// 2. Validates that the listing is active.
// 3. Prevents the listing owner from booking their own listing.
// 4. Requires an Ambassador to be assigned.
// 5. Reuses an existing unpaid inspection when possible.
// 6. Creates a pending_payment inspection when needed.
// 7. Initializes a ₦3,000 Paystack transaction.
// 8. Returns the Paystack authorization URL to the client.
//
// IMPORTANT:
// Initialising the Paystack transaction does NOT mean the inspection
// has been paid. Payment confirmation is handled separately through
// Paystack verification/webhook processing.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing, parkoutInspection } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const INSPECTION_FEE_KOBO = 300000; // ₦3,000 in kobo
const INSPECTION_FEE_NAIRA = 3000;

type Props = {
  params: Promise<{ listingid: string }>;
};

export async function POST(
  req: NextRequest,
  { params }: Props
) {
  const { listingid } = await params;

  // ── Auth check ────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 }
    );
  }

  // ── Paystack configuration check ─────────────────────────────────────────
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!paystackSecretKey || !appUrl) {
    console.error(
      "[booking/initialize] Missing Paystack or app URL configuration."
    );

    return NextResponse.json(
      { error: "Payment service is not configured. Please try again later." },
      { status: 500 }
    );
  }

  // ── Fetch listing ─────────────────────────────────────────────────────────
  const [listing] = await db
    .select({
      id: parkoutListing.id,
      outgoingUserId: parkoutListing.outgoingUserId,
      ambassadorId: parkoutListing.ambassadorId,
      title: parkoutListing.title,
      lga: parkoutListing.lga,
      status: parkoutListing.status,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.id, listingid))
    .limit(1);

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  // ── Listing must be active ────────────────────────────────────────────────
  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "This listing is no longer available." },
      { status: 400 }
    );
  }

  // ── Owner cannot book their own listing ───────────────────────────────────
  if (listing.outgoingUserId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot book an inspection for your own listing." },
      { status: 400 }
    );
  }

  // ── Ambassador must be assigned ───────────────────────────────────────────
  if (!listing.ambassadorId) {
    return NextResponse.json(
      {
        error:
          "No ambassador assigned to this listing yet. Please check back soon.",
      },
      { status: 400 }
    );
  }

  // ── Idempotency — prevent duplicate inspections ──────────────────────────
  //
  // A user should not create multiple inspection records for the same
  // listing. If an unpaid inspection already exists, we reuse it.
  const [existingInspection] = await db
    .select({
      id: parkoutInspection.id,
      status: parkoutInspection.status,
      paidAt: parkoutInspection.paidAt,
    })
    .from(parkoutInspection)
    .where(
      and(
        eq(parkoutInspection.listingId, listingid),
        eq(parkoutInspection.incomingUserId, session.user.id)
      )
    )
    .limit(1);

  if (existingInspection?.paidAt) {
    return NextResponse.json(
      {
        error:
          "You have already booked and paid for an inspection of this listing.",
      },
      { status: 400 }
    );
  }

  // ── Create or reuse parkoutInspection record ─────────────────────────────
  let inspectionId: string;

  if (existingInspection) {
    // Reuse an unpaid inspection.
    //
    // This can happen when the customer opened Paystack checkout but
    // abandoned it before completing payment.
    inspectionId = existingInspection.id;
  } else {
    // Create a new inspection in pending_payment state.
    //
    // This means the payment process has started, but Paystack has
    // NOT confirmed payment yet.
    inspectionId = `poi_${nanoid(10)}`;

    await db.insert(parkoutInspection).values({
      id: inspectionId,
      listingId: listingid,
      incomingUserId: session.user.id,
      slotNumber: 1,
      bookingFee: INSPECTION_FEE_KOBO,
      status: "pending_payment",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // ── Initialize Paystack payment ───────────────────────────────────────────
  //
  // IMPORTANT:
  // There is intentionally no split_code or subaccount here.
  //
  // The complete ₦3,000 inspection payment belongs to CorperNest.
  const callbackUrl =
    `${appUrl}/parkout/booking/${listingid}/success`;

  try {
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          amount: INSPECTION_FEE_KOBO,
          currency: "NGN",
          callback_url: callbackUrl,
          metadata: {
            type: "parkout_inspection_fee",
            listingId: listingid,
            inspectionId,
            incomingUserId: session.user.id,
            ambassadorId: listing.ambassadorId,
            listingTitle: listing.title,
            lga: listing.lga,
            amountNaira: INSPECTION_FEE_NAIRA,
          },
        }),
      }
    );

    const paystackData = await paystackRes.json();

    if (
      !paystackRes.ok ||
      !paystackData.status ||
      !paystackData.data?.authorization_url ||
      !paystackData.data?.reference
    ) {
      console.error(
        "[booking/initialize] Paystack initialization failed:",
        paystackData
      );

      return NextResponse.json(
        {
          error:
            "Payment initialization failed. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      inspectionId,
    });
  } catch (err) {
    console.error(
      "[booking/initialize] Paystack network error:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Could not reach payment provider. Please try again.",
      },
      { status: 500 }
    );
  }
}