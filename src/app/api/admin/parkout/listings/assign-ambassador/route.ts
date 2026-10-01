// src/app/api/admin/parkout/listings/assign-ambassador/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing, parkoutAmbassador } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId, ambassadorId } = await req.json();
  if (!listingId || !ambassadorId) {
    return NextResponse.json({ error: "Listing ID and Ambassador ID required." }, { status: 400 });
  }

  const [listing] = await db
    .select({ id: parkoutListing.id, lga: parkoutListing.lga, outgoingUserId: parkoutListing.outgoingUserId })
    .from(parkoutListing).where(eq(parkoutListing.id, listingId)).limit(1);

  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const [ambassador] = await db
    .select({ id: parkoutAmbassador.id, userId: parkoutAmbassador.userId, lga: parkoutAmbassador.lga })
    .from(parkoutAmbassador).where(eq(parkoutAmbassador.id, ambassadorId)).limit(1);

  if (!ambassador) return NextResponse.json({ error: "Ambassador not found." }, { status: 404 });

  await db.update(parkoutListing)
    .set({ ambassadorId, updatedAt: new Date() })
    .where(eq(parkoutListing.id, listingId));

  await createNotification({
    userId:  ambassador.userId,
    type:    "parkout-listing-assigned",
    title:   "New listing assigned 🏠",
    message: `You have been assigned a new listing in ${listing.lga}. Call the outgoing tenant to verify before it goes live.`,
    link:    "/parkout/ambassador",
  }).catch(() => {});

  return NextResponse.json({ success: true });
}