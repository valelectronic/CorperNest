// src/app/api/admin/parkout/listings/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Listing ID required." }, { status: 400 });

  const [listing] = await db
    .select({ id: parkoutListing.id, outgoingUserId: parkoutListing.outgoingUserId, title: parkoutListing.title, status: parkoutListing.status })
    .from(parkoutListing).where(eq(parkoutListing.id, listingId)).limit(1);

  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (listing.status !== "pending_approval") {
    return NextResponse.json({ error: "Listing is not pending approval." }, { status: 400 });
  }

  await db.update(parkoutListing)
    .set({ status: "active", approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(parkoutListing.id, listingId));

  // Notify outgoing tenant
  await createNotification({
    userId:  listing.outgoingUserId,
    type:    "parkout-listing-approved",
    title:   "Your listing is live! 🏠",
    message: `Your listing "${listing.title}" has been approved and is now visible to incoming tenants.`,
    link:    `/parkout/listing/${listingId}`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}