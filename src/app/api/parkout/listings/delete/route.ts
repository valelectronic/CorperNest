// src/app/api/parkout/listings/delete/route.ts

// Deletes an outgoing user's Park-Out listing.
//
// Deletion is allowed only for listings that are:
// - owned by the authenticated user
// - pending approval or rejected
//
// Active, booking_locked, completed and other progressed listings
// cannot be deleted through this endpoint.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
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

  // ── Read request ──────────────────────────────────────────────────────────
  let body: { listingId?: string };

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

  // ── Find the user's listing ───────────────────────────────────────────────
  const [listing] = await db
    .select({
      id: parkoutListing.id,
      outgoingUserId: parkoutListing.outgoingUserId,
      status: parkoutListing.status,
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

  // ── Ownership check ───────────────────────────────────────────────────────
  if (listing.outgoingUserId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only delete your own listing." },
      { status: 403 }
    );
  }

  // ── Deletion status check ─────────────────────────────────────────────────
  if (!["pending_approval", "rejected"].includes(listing.status)) {
    return NextResponse.json(
      {
        error: `This listing cannot be deleted because its current status is "${listing.status}".`,
      },
      { status: 400 }
    );
  }

  // ── Delete listing ────────────────────────────────────────────────────────
  await db
    .delete(parkoutListing)
    .where(eq(parkoutListing.id, listingId));

  return NextResponse.json({
    success: true,
    listingId,
  });
}