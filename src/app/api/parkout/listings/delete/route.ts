// src/app/api/parkout/listings/delete/route.ts

// Deletes an outgoing user's Park-Out listing and its Cloudinary images.
//
// Deletion is allowed only for listings that are:
// - owned by the authenticated user
// - pending approval or rejected
//
// Active, booking_locked, completed and other progressed listings
// cannot be deleted through this endpoint.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";

// ── Cloudinary configuration ────────────────────────────────────────────────

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// ── Cloudinary helpers ──────────────────────────────────────────────────────

function isPlaceholder(value?: string) {
  if (!value) return true;

  const normalized = value.trim().replace(/^['"]|['"]$/g, "");

  return (
    normalized.length === 0 ||
    normalized.toLowerCase() === "your_value_here" ||
    normalized.toLowerCase() === "placeholder"
  );
}

const hasValidCloudinaryConfig = !(
  isPlaceholder(cloudName) ||
  isPlaceholder(apiKey) ||
  isPlaceholder(apiSecret)
);

function getCloudinaryPublicId(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);

    // Expected Cloudinary path:
    // /image/upload/v123456789/corpernest/listings/example.jpg

    const uploadIndex = url.pathname.indexOf("/upload/");

    if (uploadIndex === -1) {
      return null;
    }

    let path = url.pathname.slice(uploadIndex + "/upload/".length);

    // Remove Cloudinary version segment, e.g. v1759234567/
    path = path.replace(/^v\d+\//, "");

    // Remove file extension.
    path = path.replace(/\.[^/.]+$/, "");

    return path || null;
  } catch {
    return null;
  }
}

async function deleteCloudinaryImage(imageUrl: string) {
  if (!hasValidCloudinaryConfig) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  const publicId = getCloudinaryPublicId(imageUrl);

  if (!publicId) {
    throw new Error(`Could not determine Cloudinary public ID from image URL.`);
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  // Cloudinary normally returns:
  // { result: "ok" }
  // or { result: "not found" }

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(
      `Cloudinary could not delete image "${publicId}". Result: ${result.result}`
    );
  }

  return result;
}

// ── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
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
      { error: "Listing ID is required." },
      { status: 400 }
    );
  }

  // ── Find listing ──────────────────────────────────────────────────────────
  const [listing] = await db
    .select({
      id: parkoutListing.id,
      outgoingUserId: parkoutListing.outgoingUserId,
      status: parkoutListing.status,
      images: parkoutListing.images,
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

  // ── Deletion status check ─────────────────────────────────────────────────
  if (!["pending_approval", "rejected"].includes(listing.status)) {
    return NextResponse.json(
      {
        error:
          `This listing cannot be deleted because its current status is "${listing.status}".`,
      },
      { status: 400 }
    );
  }

  // ── Delete Cloudinary images ──────────────────────────────────────────────
  const images = Array.isArray(listing.images) ? listing.images : [];

  if (images.length > 0) {
    try {
      await Promise.all(
        images.map((imageUrl) => deleteCloudinaryImage(imageUrl))
      );
    } catch (error) {
      console.error("Park-Out Cloudinary deletion failed:", error);

      return NextResponse.json(
        {
          error:
            "The listing could not be deleted because one or more property images could not be removed. No database record was deleted.",
        },
        { status: 500 }
      );
    }
  }

  // ── Delete database listing ───────────────────────────────────────────────
  try {
    await db
      .delete(parkoutListing)
      .where(eq(parkoutListing.id, listingId));
  } catch (error) {
    console.error("Park-Out listing database deletion failed:", error);

    return NextResponse.json(
      {
        error:
          "The images were removed, but the listing could not be deleted from the database. Please contact support.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    listingId,
  });
}