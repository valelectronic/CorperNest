// src/lib/create-notification.ts
// Server-side helper — call this from any API route when an event occurs.
// Never call from client components.
//
// Usage:
//   await createNotification({
//     userId: agentId,
//     type: "booking-created",
//     title: "New Inspection Request",
//     message: "A corper wants to inspect your Mini Flat in Uyo.",
//     link: `/bookings/${bookingId}`,
//   });

import { db } from "@/lib/db";
import { notification } from "@/db/schema";
import { nanoid } from "nanoid";

interface CreateNotificationInput {
  userId:  string;
  type:    string;
  title:   string;
  message: string;
  link?:   string;
}

export async function createNotification(input: CreateNotificationInput) {
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
}

// ─── TYPED HELPERS ────────────────────────────────────────────────────────────
// Pre-built notification creators for each event type.
// Import only what you need in each route.

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

// Agent approved by admin → agent notified (Phase 6)
export async function notifyAgentVerified({ agentId }: { agentId: string }) {
  await createNotification({
    userId:  agentId,
    type:    "agent-verified",
    title:   "You're now verified! 🎉",
    message: "Your identity has been confirmed. You can now list properties on CorperNest.",
    link:    "/agent",
  });
}