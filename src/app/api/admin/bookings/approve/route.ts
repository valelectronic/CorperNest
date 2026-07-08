// src/app/api/admin/bookings/approve/route.ts
//
// Admin approves a pending booking request.
// Creates the real booking record, notifies both client and agent
// with each other's contact details, marks the request as approved.
// No confirmation email to admin — you clicked the button yourself.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingRequest, booking, listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BK-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: { requestId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { requestId } = body;
  if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

  const [request] = await db
    .select()
    .from(bookingRequest)
    .where(eq(bookingRequest.id, requestId))
    .limit(1);

  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 409 });

  const [found] = await db
    .select({ id: listing.id, title: listing.title, status: listing.status })
    .from(listing)
    .where(eq(listing.id, request.listingId))
    .limit(1);

  if (!found || found.status !== "available") {
    return NextResponse.json({ error: "Listing is no longer available" }, { status: 409 });
  }

  const [clientRow] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, request.clientId))
    .limit(1);

  // Create the real booking
  const bookingId   = nanoid();
  const bookingCode = generateBookingCode();

  await db.insert(booking).values({
    id:                 bookingId,
    listingId:          request.listingId,
    renterId:           request.clientId,
    agentId:            request.agentId,
    bookingCode,
    renterContact:      clientRow?.email ?? "",
    renterContactType:  "email",
    status:             "pending",
    confirmationStatus: "pending",
    createdAt:          new Date(),
    updatedAt:          new Date(),
  });

  // ── Mark listing as reserved ──────────────────────────────────────────────
  // Removes the property from the public feed immediately so no other
  // client can book it while this inspection is in progress.
  // Admin releases it back to "available" if the client passes,
  // or marks it "occupied" if the client rents it.
  await db
    .update(listing)
    .set({ status: "reserved", updatedAt: new Date() })
    .where(eq(listing.id, request.listingId));

  // Mark request as approved
  await db
    .update(bookingRequest)
    .set({ status: "approved", approvedAt: new Date(), approvedBy: session.user.id })
    .where(eq(bookingRequest.id, requestId));

  // Notify client — they now see agent contact in their bookings
  await createNotification({
    userId:  request.clientId,
    type:    "booking-approved",
    title:   "Your inspection is confirmed!",
    message: `Your visit to ${found.title} has been confirmed. Check your bookings for the agent's contact details.`,
    link:    "/bookings",
  });

  // Notify agent — they now see client contact in their dashboard
  await createNotification({
    userId:  request.agentId,
    type:    "booking-created",
    title:   "New client coming to inspect!",
    message: `A client is coming to inspect ${found.title}. Check your dashboard for their contact details.`,
    link:    "/agent",
  });

  return NextResponse.json({ success: true, bookingCode });
}