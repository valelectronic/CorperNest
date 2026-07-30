// src/app/api/marketplace/availability/route.ts
//
// Availability confirmation before any payment is taken.
// Buyer requests → seller + admin notified → either confirms → buyer can pay.
// Deadlines enforced lazily at read time — no cron needed on Vercel Hobby.
//
// POST   /api/marketplace/availability         — buyer creates request
// PATCH  /api/marketplace/availability         — seller or admin confirms/denies
// GET    /api/marketplace/availability?listingId= — buyer polls for status

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  marketplaceAvailabilityRequest,
  marketplaceListing,
  marketplaceOffer,
  marketplaceTransaction,
  user,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createNotification, notifySellerAvailabilityRequest, notifyBuyerAvailabilityConfirmed, notifyBuyerAvailabilityDenied, notifyBuyerRequestExpired, notifySellerMissedSale, notifyBuyerCheckoutExpired } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

const ADMIN_EMAIL     = "corpernestng@gmail.com";
const REQUEST_TTL_MS  = 45 * 60 * 1000; // 45 minutes for seller to respond
const CHECKOUT_TTL_MS = 60 * 60 * 1000; // 1 hour for buyer to pay after confirmation

function generateId() {
  return `avail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── GET — buyer checks status OR seller fetches by requestId ─────────────────
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ request: null });

  const { searchParams } = new URL(req.url);
  const listingId  = searchParams.get("listingId");
  const requestId  = searchParams.get("requestId");

  let req_: typeof marketplaceAvailabilityRequest.$inferSelect | undefined;

  if (requestId) {
    // Seller or admin fetching by requestId directly — used by confirm-availability page
    const [found] = await db
      .select()
      .from(marketplaceAvailabilityRequest)
      .where(eq(marketplaceAvailabilityRequest.id, requestId))
      .limit(1);

    // Only seller, buyer, or admin can access
    const ADMIN = process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com";
    const isAdmin  = session.user.email === ADMIN;
    const isSeller = found?.sellerId === session.user.id;
    const isBuyer  = found?.buyerId  === session.user.id;
    if (!found || (!isAdmin && !isSeller && !isBuyer)) {
      return NextResponse.json({ request: null });
    }
    req_ = found;
  } else if (listingId) {
    // Buyer polling by listingId
    const [found] = await db
      .select()
      .from(marketplaceAvailabilityRequest)
      .where(and(
        eq(marketplaceAvailabilityRequest.listingId, listingId),
        eq(marketplaceAvailabilityRequest.buyerId, session.user.id),
        inArray(marketplaceAvailabilityRequest.status, ["pending", "confirmed"]),
      ))
      .limit(1);
    req_ = found;
  }

  if (!req_) return NextResponse.json({ request: null });

  const now = Date.now();

  // Lazy expiry — enforce at read time, no cron needed
  if (req_.status === "pending" && new Date(req_.expiresAt).getTime() < now) {
    await db.update(marketplaceAvailabilityRequest)
      .set({ status: "expired" })
      .where(eq(marketplaceAvailabilityRequest.id, req_.id));

    // Revert listing to active — seller didn't respond, but we don't know if item is sold
    await db.update(marketplaceListing)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, req_.listingId));

    // Notify buyer — item is back to available, they can try again
    await notifyBuyerRequestExpired({
      buyerId:      req_.buyerId,
      listingTitle: req_.listingId, // listingId used as fallback — title not available in GET
      listingId:    req_.listingId,
    });

    // Notify admin — seller was unreachable (best effort, no crash if fails)
    try {
      const [adminUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, ADMIN_EMAIL)).limit(1);
      if (adminUser) {
        await createNotification({
          userId:  adminUser.id,
          type:    "marketplace-availability-expired-admin",
          title:   "Seller unreachable — availability request expired",
          message: `Request expired with no seller response. Listing: ${req_.listingId}.`,
          link:    `/admin/marketplace/availability`,
        });
      }
    } catch (err) {
      console.error("[availability] Admin expiry notification failed:", err);
    }

    // Notify seller — remind them to update their listing
    await notifySellerMissedSale({
      sellerId:     req_.sellerId,
      listingTitle: req_.listingId,
    });

    return NextResponse.json({ request: { ...req_, status: "expired" } });
  }

  // Lazy checkout window expiry — buyer confirmed but didn't pay in time
  if (req_.status === "confirmed" && req_.checkoutExpiresAt && new Date(req_.checkoutExpiresAt).getTime() < now) {
    await db.update(marketplaceAvailabilityRequest)
      .set({ status: "expired" })
      .where(eq(marketplaceAvailabilityRequest.id, req_.id));

    // Revert listing to active — buyer took too long to pay
    await db.update(marketplaceListing)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, req_.listingId));

    // Notify buyer — their checkout window closed
    await notifyBuyerCheckoutExpired({
      buyerId:      req_.buyerId,
      listingTitle: req_.listingId,
      listingId:    req_.listingId,
    });

    return NextResponse.json({ request: { ...req_, status: "expired" } });
  }

  // Tell buyer if admin should be escalating now
  const minutesSinceRequest = (now - new Date(req_.createdAt).getTime()) / 60000;
  const adminEscalated = minutesSinceRequest >= 20;

  return NextResponse.json({
    request: {
      ...req_,
      agreedPrice:       req_.agreedPrice / 100,
      adminEscalated,
      expiresAtMs:       new Date(req_.expiresAt).getTime(),    // for client countdown
      checkoutExpiresAtMs: req_.checkoutExpiresAt
        ? new Date(req_.checkoutExpiresAt).getTime()
        : null,
      minutesRemaining:  Math.max(0, Math.ceil((new Date(req_.expiresAt).getTime() - now) / 60000)),
      checkoutMinutesRemaining: req_.checkoutExpiresAt
        ? Math.max(0, Math.ceil((new Date(req_.checkoutExpiresAt).getTime() - now) / 60000))
        : null,
    },
  });
}

// ── POST — buyer triggers availability confirmation ───────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { listingId, offerId } = await req.json();
  if (!listingId) {
    return NextResponse.json({ error: "Listing ID required." }, { status: 400 });
  }

  // ── Phone verification guard — uses session data, no extra DB query ───────
  const sessionUser = session.user as { phoneNumber?: string | null; phoneNumberVerified?: boolean };
  if (!sessionUser?.phoneNumber) {
    return NextResponse.json({ error: "Please verify your phone number before purchasing." }, { status: 403 });
  }

  // Fetch listing + seller name
  const [listing] = await db
    .select({
      id:       marketplaceListing.id,
      sellerId: marketplaceListing.sellerId,
      price:    marketplaceListing.price,
      title:    marketplaceListing.title,
      status:   marketplaceListing.status,
      sellerName: user.name,
      sellerPhone: user.phoneNumber,
    })
    .from(marketplaceListing)
    .innerJoin(user, eq(marketplaceListing.sellerId, user.id))
    .where(eq(marketplaceListing.id, listingId))
    .limit(1);

  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (listing.status !== "active") return NextResponse.json({ error: "This listing is no longer available." }, { status: 400 });
  if (listing.sellerId === session.user.id) return NextResponse.json({ error: "You cannot buy your own listing." }, { status: 400 });

  // Check for existing active request from this buyer
  const [existing] = await db
    .select({ id: marketplaceAvailabilityRequest.id, status: marketplaceAvailabilityRequest.status })
    .from(marketplaceAvailabilityRequest)
    .where(and(
      eq(marketplaceAvailabilityRequest.listingId, listingId),
      eq(marketplaceAvailabilityRequest.buyerId, session.user.id),
      inArray(marketplaceAvailabilityRequest.status, ["pending", "confirmed"]),
    ))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "You already have an active availability request for this listing." }, { status: 400 });
  }

  // Use negotiated price if offer is accepted, otherwise listed price
  let agreedPrice = listing.price;
  if (offerId) {
    const [offer] = await db
      .select({ latestAmount: marketplaceOffer.latestAmount, status: marketplaceOffer.status })
      .from(marketplaceOffer)
      .where(and(
        eq(marketplaceOffer.id, offerId),
        eq(marketplaceOffer.status, "accepted"),
      ))
      .limit(1);
    if (offer) agreedPrice = offer.latestAmount;
  }

  const expiresAt = new Date(Date.now() + REQUEST_TTL_MS);
  const buyerName = session.user.name ?? "A buyer";
  const priceStr  = `₦${(agreedPrice / 100).toLocaleString("en-NG")}`;

  // Set listing to "reserving" immediately — prevents another buyer from paying
  // while seller confirms. Reverts to "active" lazily if request expires or denied.
  const [existing_] = await db
    .select({ status: marketplaceListing.status })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, listingId))
    .limit(1);

  if (existing_?.status !== "active") {
    return NextResponse.json({ error: "This item is no longer available — another buyer may have reserved it." }, { status: 400 });
  }

  // Atomic status change — only succeeds if still active (race condition guard)
  const updated = await db
    .update(marketplaceListing)
    .set({ status: "reserving", updatedAt: new Date() })
    .where(and(eq(marketplaceListing.id, listingId), eq(marketplaceListing.status, "active")))
    .returning({ id: marketplaceListing.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Someone else just reserved this item. Try another listing." }, { status: 409 });
  }

  const [created] = await db
    .insert(marketplaceAvailabilityRequest)
    .values({
      id:          generateId(),
      listingId,
      buyerId:     session.user.id,
      sellerId:    listing.sellerId,
      offerId:     offerId ?? null,
      agreedPrice,
      status:      "pending",
      expiresAt,
    })
    .returning();

  // ── Notify seller — in-app + real device push (both via createNotification) ─
  await notifySellerAvailabilityRequest({
    sellerId: listing.sellerId,
    buyerName,
    listingTitle: listing.title,
    priceNaira:   agreedPrice / 100,
    listingId,
    requestId:    created.id,
  });

  // ── Notify admin via push + email ──────────────────────────────────────────
  // Look up real admin user ID — "admin" is not a valid user ID
  try {
    const [adminUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, ADMIN_EMAIL))
      .limit(1);

    if (adminUser) {
      await createNotification({
        userId:  adminUser.id,
        type:    "marketplace-availability-admin",
        title:   `Availability request — ${listing.title}`,
        message: `${buyerName} wants to buy "${listing.title}" for ${priceStr}. Seller: ${listing.sellerName ?? "unknown"}. Escalate after 30 minutes if no response.`,
        link:    `/admin/marketplace/availability`,
      });
    }
  } catch (err) {
    console.error("[availability] Admin notification failed:", err);
  }

  // Buyer phone is available from session — no extra DB query needed
  const buyerPhone = (session.user as { phoneNumber?: string | null }).phoneNumber ?? null;

  await sendAdminEmail(
    `🛍️ Availability confirmation needed — ${listing.title}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1B2E1B;margin:0 0 4px">Availability Confirmation Needed</h2>
        <p style="color:#6B7280;margin:0 0 20px;font-size:13px">
          A buyer wants to purchase an item. The seller has been notified via push.
          If the seller does not respond within 30 minutes, call them directly.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280;width:140px">Item</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:600">${listing.title}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Price</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:700">${priceStr}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Buyer</td>
              <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${buyerName} — <strong>${buyerPhone ? `<a href="tel:${buyerPhone}">${buyerPhone}</a>` : "no phone"}</strong></td></tr>
          <tr><td style="padding:10px 0;color:#6B7280">Seller</td>
              <td style="padding:10px 0">${listing.sellerName ?? "unknown"} — <strong>${listing.sellerPhone ? `<a href="tel:${listing.sellerPhone}">${listing.sellerPhone}</a>` : "no phone"}</strong></td></tr>
        </table>
        <p style="font-size:13px;color:#92400E;background:#FFF8E1;padding:12px;border-radius:8px;margin:0 0 16px">
          ⚠️ Expires: ${expiresAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}. If no response by then, call the seller directly.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://corpernest.com.ng"}/admin/marketplace/availability"
           style="display:inline-block;padding:10px 20px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
          Confirm in admin dashboard →
        </a>
      </div>
    `
  ).catch((err) => console.error("[availability] Admin email FAILED:", err));

  return NextResponse.json({
    request: {
      ...created,
      agreedPrice:      agreedPrice / 100,
      expiresAtMs:      expiresAt.getTime(),
      checkoutExpiresAtMs: null,
      minutesRemaining: 45,
      adminEscalated:   false,
    }
  });
}

// ── PATCH — seller or admin confirms or denies ────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { requestId, action, adminNote } = await req.json();
  // action: "confirm" | "deny"

  if (!requestId || !["confirm", "deny", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const [avReq] = await db
    .select()
    .from(marketplaceAvailabilityRequest)
    .where(eq(marketplaceAvailabilityRequest.id, requestId))
    .limit(1);

  if (!avReq) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (avReq.status !== "pending") return NextResponse.json({ error: "This request is no longer pending." }, { status: 400 });

  const isAdmin  = session.user.email === ADMIN_EMAIL;
  const isSeller = session.user.id === avReq.sellerId;
  const isBuyer  = session.user.id === avReq.buyerId;

  // Cancel — seller, buyer, or admin
  if (action === "cancel") {
    if (!isAdmin && !isSeller && !isBuyer) {
      return NextResponse.json({ error: "Not authorized to cancel this reservation." }, { status: 403 });
    }

    await db.update(marketplaceAvailabilityRequest)
      .set({ status: "cancelled", confirmedBy: session.user.id, confirmationMethod: isAdmin ? "admin_proxy" : isSeller ? "seller_self" : "buyer_self", confirmedAt: new Date() })
      .where(eq(marketplaceAvailabilityRequest.id, requestId));

    await db.update(marketplaceListing)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, avReq.listingId));

    // Cancel any pending transaction too
    await db.update(marketplaceTransaction)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(
        eq(marketplaceTransaction.listingId, avReq.listingId),
        eq(marketplaceTransaction.buyerId, avReq.buyerId),
        eq(marketplaceTransaction.status, "pending"),
      ))
      .catch(() => {});

    const [cancelledListing] = await db
      .select({ title: marketplaceListing.title })
      .from(marketplaceListing)
      .where(eq(marketplaceListing.id, avReq.listingId))
      .limit(1);

    // Notify the other party
    if (isBuyer) {
      // Buyer cancelled — notify seller
      await createNotification({
        userId:  avReq.sellerId,
        type:    "marketplace-availability-cancelled",
        title:   "Buyer withdrew reservation",
        message: `A buyer withdrew their reservation for "${cancelledListing?.title ?? "your item"}". The listing is active again.`,
        link:    `/marketplace/my-listings`,
      });
    } else {
      // Seller or admin cancelled — notify buyer
      await createNotification({
        userId:  avReq.buyerId,
        type:    "marketplace-availability-cancelled",
        title:   "Reservation cancelled",
        message: `The reservation for "${cancelledListing?.title ?? "the item"}" was cancelled. The item is available again if you still want it.`,
        link:    `/marketplace/${avReq.listingId}`,
      });
    }

    return NextResponse.json({ success: true, action: "cancelled" });
  }

  // Confirm and deny — seller or admin only
  if (!isAdmin && !isSeller) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  // Lazy expiry check
  if (new Date(avReq.expiresAt).getTime() < Date.now()) {
    await db.update(marketplaceAvailabilityRequest)
      .set({ status: "expired" })
      .where(eq(marketplaceAvailabilityRequest.id, requestId));
    return NextResponse.json({ error: "This request expired. Buyer will need to try again." }, { status: 400 });
  }

  const [listing] = await db
    .select({ title: marketplaceListing.title })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, avReq.listingId))
    .limit(1);

  const confirmationMethod = isAdmin ? "admin_proxy" : "seller_self";
  const priceStr = `₦${(avReq.agreedPrice / 100).toLocaleString("en-NG")}`;

  if (action === "confirm") {
    const checkoutExpiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);

    await db.update(marketplaceAvailabilityRequest)
      .set({
        status:             "confirmed",
        confirmedBy:        session.user.id,
        confirmationMethod,
        adminNote:          adminNote ?? null,
        confirmedAt:        new Date(),
        checkoutExpiresAt,
      })
      .where(eq(marketplaceAvailabilityRequest.id, requestId));

    // Listing stays "reserving" — only moves to "reserved" after Paystack payment succeeds

    // Notify buyer — in-app + push (both via createNotification)
    await notifyBuyerAvailabilityConfirmed({
      buyerId:      avReq.buyerId,
      listingTitle: listing?.title ?? "your item",
      priceNaira:   avReq.agreedPrice / 100,
      listingId:    avReq.listingId,
      requestId,
    });

    return NextResponse.json({ success: true, action: "confirmed", checkoutExpiresAt });
  }

  if (action === "deny") {
    await db.update(marketplaceAvailabilityRequest)
      .set({
        status:             "denied",
        confirmedBy:        session.user.id,
        confirmationMethod,
        adminNote:          adminNote ?? null,
        confirmedAt:        new Date(),
      })
      .where(eq(marketplaceAvailabilityRequest.id, requestId));

    // Item is no longer available — flag it and put back to active
    // so admin can investigate before relisting
    await db.update(marketplaceListing)
      .set({ status: "flagged", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, avReq.listingId));

    // Notify buyer — item is gone
    await notifyBuyerAvailabilityDenied({
      buyerId:      avReq.buyerId,
      listingTitle: listing?.title ?? "the item",
    });

    return NextResponse.json({ success: true, action: "denied" });
  }
}