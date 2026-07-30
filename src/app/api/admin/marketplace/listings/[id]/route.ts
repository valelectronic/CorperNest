// src/app/api/admin/marketplace/listings/[id]/route.ts
// Admin actions on marketplace listings: approve, reject, delete.
// Protected — admin email only.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceListing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";
import { v2 as cloudinary } from "cloudinary";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com";

cloudinary.config({
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id }             = await params;
  const { action, reason } = await req.json();

  if (!["approve", "reject", "pause", "restore"].includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const [listing] = await db
    .select({ id: marketplaceListing.id, sellerId: marketplaceListing.sellerId, title: marketplaceListing.title, status: marketplaceListing.status })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, id))
    .limit(1);

  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  if (action === "approve" || action === "restore") {
    await db.update(marketplaceListing)
      .set({
        status:     "active",
        approvedAt: action === "approve" ? new Date() : undefined,
        // Reset expiry for expired listings being restored
        expiresAt:  listing.status === "expired"
          ? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
          : undefined,
        updatedAt:  new Date(),
      })
      .where(eq(marketplaceListing.id, id));

    if (action === "approve") {
      await createNotification({
        userId:  listing.sellerId,
        type:    "marketplace-listing-approved",
        title:   "Your listing is live! 🎉",
        message: `"${listing.title}" has been approved and is now visible to buyers.`,
        link:    `/marketplace/${id}`,
      });
    } else {
      await createNotification({
        userId:  listing.sellerId,
        type:    "marketplace-listing-restored",
        title:   "Listing restored ✅",
        message: `Your listing "${listing.title}" is visible to buyers again.`,
        link:    `/marketplace/${id}`,
      });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "pause") {
    await db.update(marketplaceListing)
      .set({ status: "flagged", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, id));

    await createNotification({
      userId:  listing.sellerId,
      type:    "marketplace-listing-paused",
      title:   "Listing temporarily hidden",
      message: `Your listing "${listing.title}" has been temporarily hidden from the marketplace by admin. Contact us if this is a mistake.`,
      link:    `/marketplace/my-listings`,
    });
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    await db.update(marketplaceListing)
      .set({ status: "flagged", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, id));

    await createNotification({
      userId:  listing.sellerId,
      type:    "marketplace-listing-rejected",
      title:   "Listing needs changes",
      message: reason
        ? `Your listing "${listing.title}" was not approved. Reason: ${reason}. Please edit and resubmit.`
        : `Your listing "${listing.title}" was not approved. Please review and resubmit.`,
      link:    `/marketplace/my-listings`,
    });

    return NextResponse.json({ success: true });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [listing] = await db
    .select({ id: marketplaceListing.id, sellerId: marketplaceListing.sellerId, title: marketplaceListing.title, images: marketplaceListing.images })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, id))
    .limit(1);

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const images = listing.images ?? [];
  if (images.length > 0) {
    const publicIds = images.map(extractPublicId).filter(Boolean) as string[];
    if (publicIds.length > 0) {
      await Promise.allSettled(publicIds.map((pid) => cloudinary.uploader.destroy(pid)));
    }
  }

  await db.delete(marketplaceListing).where(eq(marketplaceListing.id, id));

  await createNotification({
    userId:  listing.sellerId,
    type:    "marketplace-listing-deleted",
    title:   "Listing removed",
    message: `Your listing "${listing.title}" was removed by CorperNest admin.`,
    link:    `/marketplace/my-listings`,
  });

  return NextResponse.json({ success: true });
}