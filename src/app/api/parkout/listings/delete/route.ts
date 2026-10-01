// src/app/api/parkout/listings/delete/route.ts
// User delete — deletes the user's own Park-Out listing.
// Cleans up:
// → Room photos from HOUSING Cloudinary
// → Occupancy proof from MARKET Cloudinary
// → Listing row from DB

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v2 as housingCloudinary } from "cloudinary";
import { v2 as marketCloudinary } from "cloudinary";

// ── Cloudinary configuration ────────────────────────────────────────────────

housingCloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

marketCloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_MARKET!,
  api_key: process.env.CLOUDINARY_API_KEY_MARKET!,
  api_secret: process.env.CLOUDINARY_API_SECRET_MARKET!,
});

// ── Cloudinary helper ───────────────────────────────────────────────────────

function extractPublicId(url: string): string | null {
  try {
    const match = url.match(
      /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]{2,4})?$/i
    );

    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// ── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  // ── Authentication ────────────────────────────────────────────────────────
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
      { error: "Listing ID required." },
      { status: 400 }
    );
  }

  // ── Find user's listing ───────────────────────────────────────────────────
  const [listing] = await db
    .select({
      id: parkoutListing.id,
      outgoingUserId: parkoutListing.outgoingUserId,
      images: parkoutListing.images,
      occupancyProofUrl: parkoutListing.occupancyProofUrl,
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

  // ── Ownership check ───────────────────────────────────────────────────────
  if (listing.outgoingUserId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only delete your own listing." },
      { status: 403 }
    );
  }

  // ── Delete room photos from HOUSING Cloudinary ────────────────────────────
  if (listing.images?.length) {
    await Promise.allSettled(
      listing.images.map(async (url) => {
        const publicId = extractPublicId(url);

        if (publicId) {
          await housingCloudinary.uploader
            .destroy(publicId)
            .catch(() => {});
        }
      })
    );
  }

  // ── Delete occupancy proof from MARKET Cloudinary ─────────────────────────
  if (listing.occupancyProofUrl) {
    const publicId = extractPublicId(listing.occupancyProofUrl);

    if (publicId) {
      await marketCloudinary.uploader
        .destroy(publicId)
        .catch(() => {});
    }
  }

  // ── Delete listing from database ──────────────────────────────────────────
  await db
    .delete(parkoutListing)
    .where(eq(parkoutListing.id, listingId));

  return NextResponse.json({
    success: true,
    listingId,
  });
}