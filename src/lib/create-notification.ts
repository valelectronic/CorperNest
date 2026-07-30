// src/lib/create-notification.ts
// Server-side helper — call this from any API route when an event occurs.
// Saves to Neon (in-app bell) AND sends real FCM push (device notification).
// Both channels fire together automatically — no need to call sendPushToUser separately.
// Never call from client components.

import { db } from "@/lib/db";
import { notification } from "@/db/schema";
import { nanoid } from "nanoid";
import { sendPushToUser } from "@/lib/fcm-server";

interface CreateNotificationInput {
  userId:  string;
  type:    string;
  title:   string;
  message: string;
  link?:   string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    // 1. Save to Neon — in-app bell icon
    await db.insert(notification).values({
      id:        nanoid(),
      userId:    input.userId,
      type:      input.type,
      title:     input.title,
      message:   input.message,
      link:      input.link ?? null,
      read:      false,
      createdAt: new Date(),
    });
  } catch (err) {
    // Never let a notification failure crash the calling route
    console.error("[createNotification] Failed silently:", err);
  }

  // Wait 1 second — INSERT above wakes Neon, then token lookup succeeds
  setTimeout(() => {
    sendPushToUser({
      userId: input.userId,
      title:  input.title,
      body:   input.message,
      link:   input.link,
    }).catch(() => {});
  }, 1000);
}

// ─── TYPED HELPERS ────────────────────────────────────────────────────────────
// Pre-built notification creators for each event type.
// Import only what you need in each route.
// Each one calls createNotification which handles BOTH in-app + push.

// Corper books → agent notified
export async function notifyAgentNewBooking({
  agentId,
  listingTitle,
  bookingId,
}: {
  agentId:      string;
  listingTitle: string;
  bookingId:    string;
}) {
  await createNotification({
    userId:  agentId,
    type:    "booking-created",
    title:   "New Inspection Request",
    message: `A corper wants to inspect your ${listingTitle}.`,
    link:    `/bookings/${bookingId}`,
  });
}

// Corper sets date → agent notified
export async function notifyAgentDateProposed({
  agentId,
  corperName,
  agreedDate,
  agreedTime,
  bookingId,
}: {
  agentId:    string;
  corperName: string;
  agreedDate: string;
  agreedTime: string;
  bookingId:  string;
}) {
  await createNotification({
    userId:  agentId,
    type:    "date-proposed",
    title:   "Inspection Date Proposed",
    message: `${corperName} proposed ${agreedDate} at ${agreedTime}. Confirm to reveal contacts.`,
    link:    `/bookings/${bookingId}`,
  });
}

// Agent confirms date → corper notified
export async function notifyCorperDateConfirmed({
  renterId,
  listingTitle,
  agreedDate,
  agreedTime,
  bookingId,
}: {
  renterId:     string;
  listingTitle: string;
  agreedDate:   string;
  agreedTime:   string;
  bookingId:    string;
}) {
  await createNotification({
    userId:  renterId,
    type:    "both-confirmed",
    title:   "Inspection Confirmed!",
    message: `Your visit to ${listingTitle} is confirmed for ${agreedDate} at ${agreedTime}. Agent contact is now visible.`,
    link:    `/bookings/${bookingId}`,
  });
}

// Agent approved by admin → agent notified
export async function notifyAgentVerified({ agentId }: { agentId: string }) {
  await createNotification({
    userId:  agentId,
    type:    "agent-verified",
    title:   "You're now verified! 🎉",
    message: "Your identity has been confirmed. You can now list properties on CorperNest.",
    link:    "/agent",
  });
}

// ── MARKETPLACE NOTIFICATIONS ─────────────────────────────────────────────────

// Buyer reserves → seller notified
export async function notifySellerAvailabilityRequest({
  sellerId, buyerName, listingTitle, priceNaira, listingId, requestId,
}: { sellerId: string; buyerName: string; listingTitle: string; priceNaira: number; listingId: string; requestId: string; }) {
  await createNotification({
    userId:  sellerId,
    type:    "marketplace-availability-request",
    title:   "Someone wants to buy your item 🛍️",
    message: `${buyerName} wants to buy "${listingTitle}" for ₦${priceNaira.toLocaleString("en-NG")}. Confirm it's still available — 45 minutes.`,
    link:    `/marketplace/${listingId}/confirm-availability?request=${requestId}`,
  });
}

// Seller confirms → buyer notified
export async function notifyBuyerAvailabilityConfirmed({
  buyerId, listingTitle, priceNaira, listingId, requestId,
}: { buyerId: string; listingTitle: string; priceNaira: number; listingId: string; requestId: string; }) {
  await createNotification({
    userId:  buyerId,
    type:    "marketplace-availability-confirmed",
    title:   "Item confirmed available! ✅",
    message: `"${listingTitle}" is confirmed at ₦${priceNaira.toLocaleString("en-NG")}. You have 1 hour to complete payment.`,
    link:    `/marketplace/${listingId}/checkout?availability=${requestId}`,
  });
}

// Seller denies → buyer notified
export async function notifyBuyerAvailabilityDenied({
  buyerId, listingTitle,
}: { buyerId: string; listingTitle: string; }) {
  await createNotification({
    userId:  buyerId,
    type:    "marketplace-availability-denied",
    title:   "Item no longer available",
    message: `"${listingTitle}" is no longer available. Browse similar listings.`,
    link:    `/marketplace`,
  });
}

// Request expired → buyer notified
export async function notifyBuyerRequestExpired({
  buyerId, listingTitle, listingId,
}: { buyerId: string; listingTitle: string; listingId: string; }) {
  await createNotification({
    userId:  buyerId,
    type:    "marketplace-availability-expired",
    title:   "Seller didn't respond in time",
    message: `"${listingTitle}" is back to available. You can try again or browse similar listings.`,
    link:    `/marketplace/${listingId}`,
  });
}

// Request expired → seller notified
export async function notifySellerMissedSale({
  sellerId, listingTitle,
}: { sellerId: string; listingTitle: string; }) {
  await createNotification({
    userId:  sellerId,
    type:    "marketplace-availability-missed",
    title:   "You missed a sale opportunity",
    message: `A buyer tried to purchase "${listingTitle}" but you didn't confirm in time. Please respond faster next time.`,
    link:    `/marketplace/my-listings`,
  });
}

// Checkout window expired → buyer notified
export async function notifyBuyerCheckoutExpired({
  buyerId, listingTitle, listingId,
}: { buyerId: string; listingTitle: string; listingId: string; }) {
  await createNotification({
    userId:  buyerId,
    type:    "marketplace-checkout-expired",
    title:   "Payment window closed",
    message: `You didn't complete payment for "${listingTitle}" in time. The item is available again.`,
    link:    `/marketplace/${listingId}`,
  });
}

// Offer received → seller notified
export async function notifySellerNewOffer({
  sellerId, buyerName, listingTitle, offerNaira, listingId,
}: { sellerId: string; buyerName: string; listingTitle: string; offerNaira: number; listingId: string; }) {
  await createNotification({
    userId:  sellerId,
    type:    "marketplace-offer",
    title:   "New offer on your listing",
    message: `${buyerName} offered ₦${offerNaira.toLocaleString("en-NG")} for "${listingTitle}".`,
    link:    `/marketplace/${listingId}`,
  });
}

// Offer accepted → buyer notified
export async function notifyBuyerOfferAccepted({
  buyerId, listingTitle, agreedNaira, listingId, offerId,
}: { buyerId: string; listingTitle: string; agreedNaira: number; listingId: string; offerId: string; }) {
  await createNotification({
    userId:  buyerId,
    type:    "marketplace-offer-accepted",
    title:   "Your offer was accepted! 🎉",
    message: `Your offer of ₦${agreedNaira.toLocaleString("en-NG")} for "${listingTitle}" was accepted.`,
    link:    `/marketplace/${listingId}?offer=${offerId}`,
  });
}

// Offer countered → buyer notified
export async function notifyBuyerOfferCountered({
  buyerId, listingTitle, counterNaira, listingId, offerId,
}: { buyerId: string; listingTitle: string; counterNaira: number; listingId: string; offerId: string; }) {
  await createNotification({
    userId:  buyerId,
    type:    "marketplace-offer-countered",
    title:   "Seller made a counter-offer",
    message: `The seller countered with ₦${counterNaira.toLocaleString("en-NG")} for "${listingTitle}".`,
    link:    `/marketplace/${listingId}?offer=${offerId}`,
  });
}

// Offer declined → the other party notified
export async function notifyOfferDeclined({
  userId, declinedBy, listingTitle, listingId,
}: { userId: string; declinedBy: "seller" | "buyer"; listingTitle: string; listingId: string; }) {
  await createNotification({
    userId,
    type:    "marketplace-offer-declined",
    title:   "Offer declined",
    message: `${declinedBy === "seller" ? "The seller" : "The buyer"} declined the offer on "${listingTitle}".`,
    link:    `/marketplace/${listingId}`,
  });
}