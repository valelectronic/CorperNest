// src/app/api/property-requests/mine/route.ts
//
// For the renter's "My Requests" tab. Returns all of this renter's
// requests (active and past), each with any matched listings attached as
// preview data — reusing the same fields PropertyCard already expects, so
// the frontend can render them with zero new card design.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyRequest, requestMatch, listing } from "@/db/schema";
import { eq, or, lt, and, inArray, desc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Lazy expiry — same check as the admin route, scoped to this renter
  await db
    .update(propertyRequest)
    .set({ status: "expired" })
    .where(
      and(
        eq(propertyRequest.renterId, session.user.id),
        or(eq(propertyRequest.status, "open"), eq(propertyRequest.status, "matched")),
        lt(propertyRequest.expiresAt, now),
      )
    );

  const requests = await db
    .select()
    .from(propertyRequest)
    .where(eq(propertyRequest.renterId, session.user.id))
    .orderBy(desc(propertyRequest.createdAt));

  if (requests.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  const requestIds = requests.map((r) => r.id);

  const matches = await db
    .select({
      requestId: requestMatch.requestId,
      note:      requestMatch.note,
      listing: {
        id:     listing.id,
        slug:   listing.slug,
        title:  listing.title,
        price:  listing.price,
        lga:    listing.lga,
        state:  listing.state,
        type:   listing.type,
        images: listing.images,
        status: listing.status,
      },
    })
    .from(requestMatch)
    .innerJoin(listing, eq(requestMatch.listingId, listing.id))
    .where(inArray(requestMatch.requestId, requestIds));

  const matchesByRequest = new Map<string, typeof matches>();
  for (const m of matches) {
    const arr = matchesByRequest.get(m.requestId) ?? [];
    arr.push(m);
    matchesByRequest.set(m.requestId, arr);
  }

  const enriched = requests.map((r) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(r.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      ...r,
      daysLeft,
      matches: matchesByRequest.get(r.id) ?? [],
    };
  });

  return NextResponse.json({ requests: enriched });
}