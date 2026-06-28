// src/app/api/property-requests/[id]/close/route.ts
//
// "I already found a place" — lets the renter close their own request at
// any time. Also usable by admin directly, for moderation/cleanup — e.g.
// deleting an obvious spam or joke request, or clearing out old expired
// ones. Removes it from both views and the database immediately either way.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyRequest } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: requestId } = await params;

  const requestRow = await db
    .select({ id: propertyRequest.id, renterId: propertyRequest.renterId, status: propertyRequest.status })
    .from(propertyRequest)
    .where(eq(propertyRequest.id, requestId))
    .limit(1);

  if (requestRow.length === 0) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const isAdmin = session.user.email === ADMIN_EMAIL;
  const isOwner = requestRow[0].renterId === session.user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // The renter can't close something already resolved one way or another.
  // Admin can delete regardless of status — covers cleanup of old expired
  // or spam requests without needing a separate moderation tool.
  if (!isAdmin && ["booked", "expired"].includes(requestRow[0].status)) {
    return NextResponse.json({ error: "This request is already resolved" }, { status: 409 });
  }

  // Actually delete the row — not just flag it. Any matches tied to this
  // request get removed automatically too, since requestMatch references
  // propertyRequest with onDelete: "cascade".
  await db.delete(propertyRequest).where(eq(propertyRequest.id, requestId));

  return NextResponse.json({ success: true });
}