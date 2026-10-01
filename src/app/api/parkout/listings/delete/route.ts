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
import { eq, and, inArray } from "drizzle-orm";

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

  // ── Verify ownership and deletion status ──────────────────────────────────
  const [listing] = await db
    .select({
      id: parkoutListing.id,
      status: parkoutListing.status,
    })
    .from(parkoutListing)
    .where(
      and(
        eq(parkoutListing.id, listingId),
        eq(parkoutListing.outgoingUserId, session.user.id),
        inArray(parkoutListing.status, [
          "pending_approval",
          "rejected",
        ])
      )
    )
    .limit(1);

  if (!listing) {
    return NextResponse.json(
      {
        error:
          "This listing cannot be deleted. It may not belong to you or may have progressed beyond the deletion stage.",
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