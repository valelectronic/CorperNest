// src/app/api/admin/listings/[id]/delete/route.ts
// Admin-only — permanently deletes a property listing from Neon AND Cloudinary.
// Fetches images first, deletes from Cloudinary, then removes from DB.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com";

function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]{2,4})?$/i);
    return match ? match[1] : null;
  } catch { return null; }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)                     return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Admin only."   }, { status: 403 });

  const { listingId } = await params;

  // Fetch listing first to get images
  const [found] = await db
    .select({ id: listing.id, images: listing.images })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);

  if (!found) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  // Delete images from Cloudinary — fire and forget, never block on this
  const images    = found.images ?? [];
  const publicIds = images.map(extractPublicId).filter(Boolean) as string[];
  if (publicIds.length > 0) {
    await Promise.allSettled(
      publicIds.map((pid) => cloudinary.uploader.destroy(pid))
    );
  }

  // Delete from Neon
  await db.delete(listing).where(eq(listing.id, listingId));

  return NextResponse.json({ success: true });
}