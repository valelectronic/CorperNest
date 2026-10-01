// src/app/api/admin/parkout/listings/delete/route.ts
// Admin hard delete — bypasses all status and ownership checks.
// Cleans up:
// → Room photos from HOUSING Cloudinary
// → Occupancy proof from MARKET Cloudinary
// → Listing row from DB (cascade removes inspections + commissions)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v2 as housingCloudinary } from "cloudinary";
import { v2 as marketCloudinary } from "cloudinary";

const ADMIN_EMAIL = "corpernestng@gmail.com";

// HOUSING Cloudinary — room photos
housingCloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// MARKET Cloudinary — occupancy proof
marketCloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_MARKET!,
  api_key:    process.env.CLOUDINARY_API_KEY_MARKET!,
  api_secret: process.env.CLOUDINARY_API_SECRET_MARKET!,
});

function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]{2,4})?$/i);
    return match ? match[1] : null;
  } catch { return null; }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await req.json();
  if (!listingId) {
    return NextResponse.json({ error: "Listing ID required." }, { status: 400 });
  }

  const [listing] = await db
    .select({
      id:                parkoutListing.id,
      images:            parkoutListing.images,
      occupancyProofUrl: parkoutListing.occupancyProofUrl,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  // Delete room photos from HOUSING Cloudinary
  if (listing.images?.length) {
    await Promise.allSettled(
      listing.images.map(async (url) => {
        const publicId = extractPublicId(url);
        if (publicId) await housingCloudinary.uploader.destroy(publicId).catch(() => {});
      })
    );
  }

  // Delete occupancy proof from MARKET Cloudinary
  if (listing.occupancyProofUrl) {
    const publicId = extractPublicId(listing.occupancyProofUrl);
    if (publicId) await marketCloudinary.uploader.destroy(publicId).catch(() => {});
  }

  // Delete from DB — cascade handles inspections + commissions
  await db.delete(parkoutListing).where(eq(parkoutListing.id, listingId));

  return NextResponse.json({ success: true });
}