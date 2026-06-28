// src/app/api/property-requests/list/route.ts
//
// For the admin/agent queue. Returns requests that still need attention —
// "open" (no matches yet) or "matched" (under the 3-match cap, could still
// take more). Expiry is checked lazily right here, on read — no cron job,
// no background process. Any request whose 7-day window has passed gets
// flipped to "expired" the moment anyone fetches the list, then excluded.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyRequest, requestMatch, user } from "@/db/schema";
import { eq, or, lt, and, inArray } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.email === ADMIN_EMAIL;
  const userRow = await db
    .select({ agentVerified: user.agentVerified })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  const isVerifiedAgent = userRow[0]?.agentVerified === true;

  if (!isAdmin && !isVerifiedAgent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date();

  // ── Lazy expiry — flip anything past its window before reading ──────────
  await db
    .update(propertyRequest)
    .set({ status: "expired" })
    .where(
      and(
        or(eq(propertyRequest.status, "open"), eq(propertyRequest.status, "matched")),
        lt(propertyRequest.expiresAt, now),
      )
    );

  const requests = await db
    .select({
      id:         propertyRequest.id,
      renterName: user.name,
      lga:        propertyRequest.lga,
      state:      propertyRequest.state,
      type:       propertyRequest.type,
      landmark:   propertyRequest.landmark,
      minBudget:  propertyRequest.minBudget,
      maxBudget:  propertyRequest.maxBudget,
      notes:      propertyRequest.notes,
      status:     propertyRequest.status,
      createdAt:  propertyRequest.createdAt,
      expiresAt:  propertyRequest.expiresAt,
    })
    .from(propertyRequest)
    .innerJoin(user, eq(propertyRequest.renterId, user.id))
    .where(or(eq(propertyRequest.status, "open"), eq(propertyRequest.status, "matched")))
    .orderBy(propertyRequest.expiresAt); // most urgent (soonest expiry) first

  if (requests.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  // Attach match counts so the UI knows how many of the 3 slots are used
  const requestIds = requests.map((r) => r.id);
  const matchCounts = await db
    .select({ requestId: requestMatch.requestId })
    .from(requestMatch)
    .where(inArray(requestMatch.requestId, requestIds));

  const countMap = new Map<string, number>();
  for (const m of matchCounts) {
    countMap.set(m.requestId, (countMap.get(m.requestId) ?? 0) + 1);
  }

  const enriched = requests.map((r) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(r.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      ...r,
      matchCount: countMap.get(r.id) ?? 0,
      daysLeft,
    };
  });

  return NextResponse.json({ requests: enriched });
}