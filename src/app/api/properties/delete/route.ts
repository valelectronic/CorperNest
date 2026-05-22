import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts Cloudinary public_id from a secure_url.
 * e.g. "https://res.cloudinary.com/dx2rhkfdh/image/upload/v1779328264/corpernest/listings/abc.jpg"
 * → "corpernest/listings/abc"
 */
function extractPublicId(secureUrl: string): string | null {
  try {
    const afterUpload = secureUrl.split("/upload/")[1];
    if (!afterUpload) return null;
    // Remove version segment (v1779328264/) if present
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    // Remove file extension
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");
    return withoutExtension;
  } catch {
    return null;
  }
}

async function deleteCloudinaryImages(imageUrls: string[]): Promise<void> {
  const publicIds = imageUrls
    .map(extractPublicId)
    .filter((id): id is string => id !== null);

  if (publicIds.length === 0) return;

  // allSettled — if one image is already gone, don't block the rest
  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, { resource_type: "image" })
    )
  );
}

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "agent") {
    return NextResponse.json({ error: "Only agents can delete listings" }, { status: 403 });
  }

  // 2. Parse body
  let body: { listingId?: string; mode?: "temporary" | "permanent" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { listingId, mode } = body;

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  if (mode !== "temporary" && mode !== "permanent") {
    return NextResponse.json(
      { error: "mode must be 'temporary' or 'permanent'" },
      { status: 400 }
    );
  }

  // 3. Ownership check — fetch full listing to get images + verify ownership
  const [found] = await db
    .select({ id: listing.id, agentId: listing.agentId, images: listing.images })
    .from(listing)
    .where(and(eq(listing.id, listingId), eq(listing.agentId, session.user.id)))
    .limit(1);

  if (!found) {
    return NextResponse.json(
      { error: "Listing not found or you don't have permission" },
      { status: 404 }
    );
  }

  const now = new Date();

  if (mode === "temporary") {
    // Soft hide — agent can restore from dashboard, no Cloudinary deletion
    await db
      .update(listing)
      .set({
        status: "temp-unavailable",
        lastStatusUpdate: now,
        updatedAt: now,
      })
      .where(eq(listing.id, listingId));

    return NextResponse.json({ success: true, mode: "temporary" });
  }

  // Permanent — mark inactive in DB first, then clean Cloudinary
  await db
    .update(listing)
    .set({
      isActive: false,
      lastStatusUpdate: now,
      updatedAt: now,
    })
    .where(eq(listing.id, listingId));

  // Delete images from Cloudinary after DB succeeds
  if (found.images && found.images.length > 0) {
    await deleteCloudinaryImages(found.images);
  }

  return NextResponse.json({ success: true, mode: "permanent" });
}