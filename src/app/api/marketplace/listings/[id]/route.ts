// src/app/api/marketplace/listings/[id]/route.ts
// DELETE — removes a listing from Neon and deletes its images from Cloudinary
// Only the seller who created it OR admin can delist
// Blocked if there is an active escrow transaction on this listing

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceListing, marketplaceTransaction } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
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

// ── DELETE — seller or admin removes listing ──────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = session.user.email === ADMIN_EMAIL;

  const [listing] = await db
    .select({ id: marketplaceListing.id, sellerId: marketplaceListing.sellerId, images: marketplaceListing.images, status: marketplaceListing.status })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, id));

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (!isAdmin && listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized to delist this item." }, { status: 403 });
  }

  const [activeTransaction] = await db
    .select({ id: marketplaceTransaction.id })
    .from(marketplaceTransaction)
    .where(and(
      eq(marketplaceTransaction.listingId, id),
      inArray(marketplaceTransaction.status, ["pending", "escrow"])
    ));

  if (activeTransaction) {
    return NextResponse.json({
      error: "Cannot delist — a payment is currently held in escrow for this item. Resolve the transaction first.",
    }, { status: 400 });
  }

  const images = listing.images ?? [];
  if (images.length > 0) {
    const publicIds = images.map(extractPublicId).filter(Boolean) as string[];
    if (publicIds.length > 0) {
      await Promise.allSettled(publicIds.map((pid) => cloudinary.uploader.destroy(pid)));
    }
  }

  await db.delete(marketplaceListing).where(eq(marketplaceListing.id, id));

  return NextResponse.json({ success: true });
}

// ── GET — fetch a single listing ──────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [listing] = await db
      .select()
      .from(marketplaceListing)
      .where(eq(marketplaceListing.id, id));

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    return NextResponse.json({
      ...listing,
      price: listing.price / 100,
    });
  } catch (err) {
    console.error("[marketplace/listing/get]", err);
    return NextResponse.json({ error: "Could not fetch listing." }, { status: 500 });
  }
}

// ── PATCH — seller updates their own listing status ───────────────────────────
// action: "mark-sold" → marks item as sold outside escrow
// action: "relist"    → expired/flagged listing goes back to pending for admin review
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { id }     = await params;
  const { action } = await req.json();

  if (!["mark-sold", "relist"].includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const [listing] = await db
    .select({ id: marketplaceListing.id, sellerId: marketplaceListing.sellerId, status: marketplaceListing.status, title: marketplaceListing.title })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, id))
    .limit(1);

  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "Not your listing." }, { status: 403 });

  if (action === "mark-sold") {
    if (!["active", "reserving"].includes(listing.status)) {
      return NextResponse.json({ error: "Only active listings can be marked as sold." }, { status: 400 });
    }
    await db.update(marketplaceListing)
      .set({ status: "sold", updatedAt: new Date() })
      .where(eq(marketplaceListing.id, id));
    return NextResponse.json({ success: true });
  }

  if (action === "relist") {
    if (!["expired", "flagged"].includes(listing.status)) {
      return NextResponse.json({ error: "Only expired or flagged listings can be relisted." }, { status: 400 });
    }
    await db.update(marketplaceListing)
      .set({ status: "pending", approvedAt: null, expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), updatedAt: new Date() })
      .where(eq(marketplaceListing.id, id));
    return NextResponse.json({ success: true });
  }
}