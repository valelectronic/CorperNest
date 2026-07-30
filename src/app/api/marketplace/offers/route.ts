// src/app/api/marketplace/offers/route.ts
// Offer negotiation between buyer and seller.
// Actions: make, accept, counter, decline
// Both sides can counter up to MAX_COUNTERS total combined.
// Both sides can accept at any point.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceOffer, marketplaceListing } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createNotification } from "@/lib/create-notification";

const MAX_COUNTERS = 4; // total counters across both sides
const EXPIRES_MS   = 2 * 60 * 60 * 1000; // 2 hours per round

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const { action, listingId, offerId, amount } = await req.json();

  // ── MAKE — buyer creates initial offer ─────────────────────────────────────
  if (action === "make") {
    if (!listingId || !amount) return NextResponse.json({ error: "Listing and amount required." }, { status: 400 });

    const offerAmount = Math.round(Number(amount) * 100);
    if (offerAmount <= 0) return NextResponse.json({ error: "Invalid offer amount." }, { status: 400 });

    const [listing] = await db
      .select({ id: marketplaceListing.id, sellerId: marketplaceListing.sellerId, price: marketplaceListing.price, title: marketplaceListing.title, status: marketplaceListing.status })
      .from(marketplaceListing)
      .where(eq(marketplaceListing.id, listingId))
      .limit(1);

    if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    if (listing.status !== "active") return NextResponse.json({ error: "This listing is not available." }, { status: 400 });
    if (listing.sellerId === session.user.id) return NextResponse.json({ error: "Cannot offer on your own listing." }, { status: 400 });

    const newOffer = await db
      .insert(marketplaceOffer)
      .values({
        id:           nanoid(),
        listingId,
        buyerId:      session.user.id,
        sellerId:     listing.sellerId,
        listedPrice:  listing.price,
        latestAmount: offerAmount,
        counterCount: 0,
        status:       "pending",
        history:      JSON.stringify([{ amount: offerAmount, fromRole: "buyer", createdAt: new Date().toISOString() }]),
        expiresAt:    new Date(Date.now() + EXPIRES_MS),
      })
      .returning()
      .then((r) => r[0]);

    await createNotification({
      userId:  listing.sellerId,
      type:    "marketplace-offer",
      title:   "New offer on your listing 💬",
      message: `Someone offered ₦${Number(amount).toLocaleString("en-NG")} for "${listing.title}". Tap to accept, counter, or decline.`,
      link:    `/marketplace/${listingId}?offer=${newOffer.id}`,
    });

    return NextResponse.json({ success: true, offerId: newOffer.id });
  }

  // ── All other actions require an offerId ───────────────────────────────────
  if (!offerId) return NextResponse.json({ error: "Offer ID required." }, { status: 400 });

  const [offer] = await db
    .select()
    .from(marketplaceOffer)
    .where(eq(marketplaceOffer.id, offerId))
    .limit(1);

  if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });

  const isSeller = offer.sellerId === session.user.id;
  const isBuyer  = offer.buyerId  === session.user.id;
  if (!isSeller && !isBuyer) return NextResponse.json({ error: "Unauthorized." }, { status: 403 });

  // ── ACCEPT — either party accepts the current latest amount ───────────────
  if (action === "accept") {
    if (!["pending", "countered"].includes(offer.status)) {
      return NextResponse.json({ error: "This offer can no longer be accepted." }, { status: 400 });
    }

    await db.update(marketplaceOffer)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(marketplaceOffer.id, offerId));

    const agreedPrice = offer.latestAmount / 100;

    // Notify the other party
    const notifyUserId = isSeller ? offer.buyerId : offer.sellerId;
    await createNotification({
      userId:  notifyUserId,
      type:    "marketplace-offer-accepted",
      title:   "Offer accepted! 🎉",
      message: `${isSeller ? "The seller" : "The buyer"} accepted ₦${agreedPrice.toLocaleString("en-NG")}. Proceed to complete the purchase.`,
      link:    `/marketplace/${offer.listingId}?offer=${offerId}`,
    });

    return NextResponse.json({ success: true, agreedPrice });
  }

  // ── COUNTER — either party counters with a new amount ─────────────────────
  if (action === "counter") {
    if (!amount) return NextResponse.json({ error: "Counter amount required." }, { status: 400 });
    if (!["pending", "countered"].includes(offer.status)) {
      return NextResponse.json({ error: "Cannot counter at this stage." }, { status: 400 });
    }
    if (offer.counterCount >= MAX_COUNTERS) {
      return NextResponse.json({ error: "Maximum counters reached. Please accept or decline." }, { status: 400 });
    }

    // Seller can counter pending offers, buyer can counter countered offers
    // But both can counter — the key is alternating turns
    const lastHistory = JSON.parse(offer.history as string) as { fromRole: string }[];
    const lastRole    = lastHistory[lastHistory.length - 1]?.fromRole;
    if (isSeller && lastRole === "seller") return NextResponse.json({ error: "Waiting for buyer to respond." }, { status: 400 });
    if (isBuyer  && lastRole === "buyer")  return NextResponse.json({ error: "Waiting for seller to respond." }, { status: 400 });

    const counterAmount = Math.round(Number(amount) * 100);
    if (counterAmount <= 0) return NextResponse.json({ error: "Invalid counter amount." }, { status: 400 });

    const history = JSON.parse(offer.history as string);
    history.push({ amount: counterAmount, fromRole: isSeller ? "seller" : "buyer", createdAt: new Date().toISOString() });

    await db.update(marketplaceOffer)
      .set({
        latestAmount: counterAmount,
        counterCount: offer.counterCount + 1,
        status:       "countered",
        history:      JSON.stringify(history),
        expiresAt:    new Date(Date.now() + EXPIRES_MS),
        updatedAt:    new Date(),
      })
      .where(eq(marketplaceOffer.id, offerId));

    const notifyUserId = isSeller ? offer.buyerId : offer.sellerId;
    const fromLabel    = isSeller ? "Seller" : "Buyer";
    await createNotification({
      userId:  notifyUserId,
      type:    "marketplace-offer-countered",
      title:   `${fromLabel} made a counter-offer`,
      message: `${fromLabel} countered with ₦${Number(amount).toLocaleString("en-NG")}. Tap to accept, counter, or decline.`,
      link:    `/marketplace/${offer.listingId}?offer=${offerId}`,
    });

    return NextResponse.json({ success: true });
  }

  // ── DECLINE — either party declines ───────────────────────────────────────
  if (action === "decline") {
    if (!["pending", "countered"].includes(offer.status)) {
      return NextResponse.json({ error: "This offer is already closed." }, { status: 400 });
    }

    await db.update(marketplaceOffer)
      .set({ status: "declined", updatedAt: new Date() })
      .where(eq(marketplaceOffer.id, offerId));

    const notifyUserId = isSeller ? offer.buyerId : offer.sellerId;
    await createNotification({
      userId:  notifyUserId,
      type:    "marketplace-offer-declined",
      title:   "Offer declined",
      message: `${isSeller ? "The seller" : "The buyer"} declined the offer. The listing is still available.`,
      link:    `/marketplace/${offer.listingId}`,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

// ── GET — fetch active offer for this listing for the current user ─────────
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ offer: null });

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ offer: null });

  const [offer] = await db
    .select()
    .from(marketplaceOffer)
    .where(and(
      eq(marketplaceOffer.listingId, listingId),
      inArray(marketplaceOffer.status, ["pending", "countered"]),
    ))
    .limit(1);

  if (!offer) return NextResponse.json({ offer: null });

  // Only buyer or seller can see this offer
  const isBuyer  = offer.buyerId  === session.user.id;
  const isSeller = offer.sellerId === session.user.id;
  if (!isBuyer && !isSeller) return NextResponse.json({ offer: null });

  return NextResponse.json({
    offer: {
      ...offer,
      listedPrice:  offer.listedPrice  / 100,
      latestAmount: offer.latestAmount / 100,
      // Convert history amounts from kobo to naira
      history: (JSON.parse(offer.history as string) as { amount: number; fromRole: string; createdAt: string }[])
        .map((h) => ({ ...h, amount: h.amount / 100 })),
    }
  });
}