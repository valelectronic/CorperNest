// src/app/api/admin/parkout/listings/confirm-handover/route.ts
// Confirms key handover and marks the listing as completed.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await req.json();

  if (!listingId) {
    return NextResponse.json(
      { error: "Listing ID required." },
      { status: 400 }
    );
  }

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

  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "Listing must be active to confirm handover." },
      { status: 400 }
    );
  }

  // ── Mark listing as completed ────────────────────────────────
  await db
    .update(parkoutListing)
    .set({
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(parkoutListing.id, listingId));

  // ── Notify outgoing tenant ────────────────────────────────────
  await createNotification({
    userId: listing.outgoingUserId,
    type: "parkout-handover-confirmed",
    title: "Handover confirmed 🎉",
    message:
      "Your room handover has been confirmed. The Park-Out listing is now completed.",
    link: "/parkout",
  }).catch(() => {});

  return NextResponse.json({ success: true });
}