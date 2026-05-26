
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

const VALID_STATUSES = ["available", "occupied", "temp-unavailable"];

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Role check
  if (session.user.role !== "agent") {
    return NextResponse.json(
      { error: "Only agents can update listing status" },
      { status: 403 }
    );
  }

  // 3. Parse body
  let body: { listingId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { listingId, status } = body;

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  // 4. Ownership check + update in one query
  // Only updates if both listingId AND agentId match — prevents agents
  // updating each other's listings
  const now = new Date();

  const result = await db
    .update(listing)
    .set({
      status,
      lastStatusUpdate: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(listing.id, listingId),
        eq(listing.agentId, session.user.id),
        eq(listing.isActive, true),
      )
    )
    .returning({ id: listing.id });

  if (result.length === 0) {
    return NextResponse.json(
      { error: "Listing not found or you don't have permission" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}