// src/app/api/admin/listings/[listingId]/status/route.ts
//
// Admin-only. Updates listing status after a confirmed visit.
// Called from the admin bookings page when you find out the outcome
// of a client visit — either the client rented (occupied) or passed
// (available again).
//
// Three actions:
//   occupied  — client rented, listing permanently off market
//   available — client passed, listing back to open for bookings
//   reserved  — manually re-reserve if needed

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

const VALID_STATUSES = ["available", "occupied", "reserved", "temp-unavailable"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { listingId } = await params;

  let body: { status?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [found] = await db
    .select({ id: listing.id, title: listing.title, agentId: listing.agentId })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);

  if (!found) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  await db
    .update(listing)
    .set({ status, isActive: status !== "temp-unavailable", updatedAt: new Date() })
    .where(eq(listing.id, listingId));

  // Notify agent so they always know what happened to their listing
  const messages: Record<string, string> = {
    occupied:          `Your listing "${found.title}" has been marked as occupied. Congratulations on the rental!`,
    available:         `Your listing "${found.title}" is now available again for new bookings.`,
    reserved:          `Your listing "${found.title}" has been marked as reserved.`,
    "temp-unavailable": `Your listing "${found.title}" has been temporarily hidden.`,
  };

  await createNotification({
    userId:  found.agentId,
    type:    "listing-status-update",
    title:   status === "occupied" ? "Listing rented 🎉" : "Listing status updated",
    message: messages[status] ?? "Your listing status has been updated.",
    link:    "/agent",
  });

  return NextResponse.json({ success: true, status });
}