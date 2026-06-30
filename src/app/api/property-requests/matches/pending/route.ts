// src/app/api/property-requests/matches/pending/route.ts
//
// Admin-only. Returns every match currently awaiting review, with the
// listing's real price and the renter's stated budget/landmark sitting
// side by side — so fit is visible at a glance, not something admin has
// to manually cross-reference across two screens.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyRequest, requestMatch, listing, user } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rows = await db
    .select({
      matchId:        requestMatch.id,
      note:           requestMatch.note,
      createdAt:      requestMatch.createdAt,
      requestId:      propertyRequest.id,
      renterName:     user.name,
      minBudget:      propertyRequest.minBudget,
      maxBudget:      propertyRequest.maxBudget,
      landmark:       propertyRequest.landmark,
      listingId:      listing.id,
      listingTitle:   listing.title,
      listingPrice:   listing.price,
      listingLga:     listing.lga,
      listingImages:  listing.images,
      agentId:        requestMatch.matchedBy,
    })
    .from(requestMatch)
    .innerJoin(propertyRequest, eq(requestMatch.requestId, propertyRequest.id))
    .innerJoin(listing, eq(requestMatch.listingId, listing.id))
    .innerJoin(user, eq(propertyRequest.renterId, user.id))
    .where(eq(requestMatch.status, "pending"))
    .orderBy(desc(requestMatch.createdAt));

  const agentRows = await Promise.all(
    rows.map((r) =>
      db.select({ name: user.name }).from(user).where(eq(user.id, r.agentId)).limit(1)
    )
  );

  const pendingMatches = rows.map((r, i) => {
    const withinBudget = r.minBudget && r.maxBudget
      ? r.listingPrice >= r.minBudget && r.listingPrice <= r.maxBudget
      : null; // null = renter didn't specify a budget, not a fail

    return {
      matchId:       r.matchId,
      requestId:     r.requestId,
      renterName:    r.renterName,
      agentName:     agentRows[i][0]?.name ?? "Unknown",
      note:          r.note,
      createdAt:     r.createdAt,
      minBudget:     r.minBudget,
      maxBudget:     r.maxBudget,
      landmark:      r.landmark,
      listingId:     r.listingId,
      listingTitle:  r.listingTitle,
      listingPrice:  r.listingPrice,
      listingLga:    r.listingLga,
      listingImage:  r.listingImages?.[0] ?? null,
      withinBudget, // true | false | null
    };
  });

  return NextResponse.json({ pendingMatches });
}