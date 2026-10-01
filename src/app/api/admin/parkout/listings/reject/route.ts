// src/app/api/admin/parkout/listings/reject/route.ts
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

  const { listingId, reason } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Listing ID required." }, { status: 400 });
  if (!reason?.trim()) return NextResponse.json({ error: "Rejection reason required." }, { status: 400 });

  const [listing] = await db
    .select({ id: parkoutListing.id, outgoingUserId: parkoutListing.outgoingUserId, title: parkoutListing.title })
    .from(parkoutListing).where(eq(parkoutListing.id, listingId)).limit(1);

  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  await db.update(parkoutListing)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(parkoutListing.id, listingId));

  await createNotification({
    userId:  listing.outgoingUserId,
    type:    "parkout-listing-rejected",
    title:   "Listing update",
    message: `Your listing "${listing.title}" was not approved. Reason: ${reason}`,
    link:    "/parkout/new",
  }).catch(() => {});

  return NextResponse.json({ success: true });
}