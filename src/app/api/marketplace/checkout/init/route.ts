// src/app/api/marketplace/checkout/init/route.ts
// Initializes a Paystack payment for a marketplace order transaction.
// Called when buyer taps "Pay Now" on the checkout page.
//
// Guards:
// 1. Availability request must be confirmed and checkout window must not be expired
// 2. Listing must still be "reserving" (race condition guard — first write wins)
// 3. No duplicate transaction for same availability request
//
// Payment (all in kobo):
//   Buyer pays:      agreedPrice exactly
//   Seller receives: Math.floor(agreedPrice * 0.95)
//   Commission:      Math.floor(agreedPrice * 0.05)
//   Paystack fee:    absorbed from commission

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  marketplaceAvailabilityRequest,
  marketplaceListing,
  marketplaceTransaction,
  user,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const COMMISSION_RATE = 0.05;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://corpernest.com.ng";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { availabilityRequestId } = await req.json();
  if (!availabilityRequestId) {
    return NextResponse.json({ error: "Availability request ID required." }, { status: 400 });
  }

  // ── 1. Fetch availability request first — need its listingId for next queries
  const [avReq] = await db
    .select()
    .from(marketplaceAvailabilityRequest)
    .where(and(
      eq(marketplaceAvailabilityRequest.id, availabilityRequestId),
      eq(marketplaceAvailabilityRequest.buyerId, session.user.id),
    ))
    .limit(1);

  if (!avReq) {
    return NextResponse.json({ error: "Availability request not found." }, { status: 404 });
  }

  if (avReq.status !== "confirmed") {
    return NextResponse.json({ error: "This item has not been confirmed as available yet." }, { status: 400 });
  }

  // Lazy checkout expiry check
  if (avReq.checkoutExpiresAt && new Date(avReq.checkoutExpiresAt).getTime() < Date.now()) {
    await db.update(marketplaceAvailabilityRequest)
      .set({ status: "expired" })
      .where(eq(marketplaceAvailabilityRequest.id, avReq.id));
    await db.update(marketplaceListing)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, avReq.listingId));
    return NextResponse.json({ error: "Your checkout window expired. Please try again." }, { status: 400 });
  }

  // ── 2. Fetch listing + existing transaction + buyer email in parallel
  // Small delay — avReq query above wakes Neon, wait for it to be fully ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  const [[listing_], [existing], [buyer]] = await Promise.all([
    db.select({ id: marketplaceListing.id, status: marketplaceListing.status, title: marketplaceListing.title })
      .from(marketplaceListing)
      .where(eq(marketplaceListing.id, avReq.listingId))
      .limit(1),

    db.select({ id: marketplaceTransaction.id, status: marketplaceTransaction.status, paystackRef: marketplaceTransaction.paystackRef })
      .from(marketplaceTransaction)
      .where(and(
        eq(marketplaceTransaction.listingId, avReq.listingId),
        eq(marketplaceTransaction.buyerId, session.user.id),
      ))
      .limit(1),

    db.select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1),
  ]);

  // ── 3. Validate results ────────────────────────────────────────────────
  if (!listing_) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (!["reserving", "reserved"].includes(listing_.status)) {
    return NextResponse.json({ error: "This item is no longer available." }, { status: 400 });
  }
  if (existing && existing.status !== "pending") {
    return NextResponse.json({ error: "A transaction already exists for this item." }, { status: 400 });
  }
  if (!buyer?.email) {
    return NextResponse.json({ error: "Could not find buyer details." }, { status: 500 });
  }

  // ── 4. Calculate amounts ────────────────────────────────────────────────
  const agreedPrice  = avReq.agreedPrice; // kobo
  const commission   = Math.floor(agreedPrice * COMMISSION_RATE);
  const sellerPayout = agreedPrice - commission; // 95%

  // ── 5. Create or reuse pending transaction ──────────────────────────────
  // If a pending transaction already exists reuse it — avoids accumulation
  // of abandoned pending rows in Neon from cancelled Paystack sessions
  let transactionId: string;

  if (existing?.status === "pending") {
    // Reuse existing — update amounts in case agreedPrice changed
    await db.update(marketplaceTransaction)
      .set({ amount: agreedPrice, commission, sellerPayout, updatedAt: new Date() })
      .where(eq(marketplaceTransaction.id, existing.id));
    transactionId = existing.id;
  } else {
    const txnId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await db.insert(marketplaceTransaction).values({
      id:           txnId,
      listingId:    avReq.listingId,
      buyerId:      session.user.id,
      sellerId:     avReq.sellerId,
      amount:       agreedPrice,
      commission,
      sellerPayout,
      status:       "pending",
    });
    transactionId = txnId;
  }

  // ── 6. Initialize Paystack ──────────────────────────────────────────────
  const paystackRef  = `mkt_${nanoid(12)}`;
  const callbackUrl  = `${APP_URL}/marketplace/${avReq.listingId}/checkout/success?ref=${paystackRef}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      email:        buyer.email,
      amount:       agreedPrice, // kobo
      reference:    paystackRef,
      callback_url: callbackUrl,
      metadata: {
        type:                  "marketplace",
        transactionId,
        availabilityRequestId: avReq.id,
        listingId:             avReq.listingId,
        sellerId:              avReq.sellerId,
        buyerName:             buyer.name ?? "Buyer",
        listingTitle:          listing_.title,
        agreedPrice,
        commission,
        sellerPayout,
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackRes.ok || !paystackData.data?.authorization_url) {
    console.error("[checkout/init] Paystack error:", paystackData);
    return NextResponse.json({ error: "Could not initialize payment. Try again." }, { status: 500 });
  }

  // Store Paystack ref on the transaction
  await db.update(marketplaceTransaction)
    .set({ paystackRef })
    .where(eq(marketplaceTransaction.id, transactionId));

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference:        paystackRef,
    amount:           agreedPrice / 100,
    commission:       commission / 100,
    sellerPayout:     sellerPayout / 100,
  });
}