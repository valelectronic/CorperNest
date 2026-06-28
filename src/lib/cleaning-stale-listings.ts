// src/lib/cleanup-stale-listings.ts
//
// Called lazily whenever an agent or admin loads their listings view —
// NOT a cron job, no background process, zero idle cost.
//
// Safe-delete rule: status is occupied or temp-unavailable, untouched for
// 30+ days, AND zero bookings ever exist for that listing. Checking
// bookings directly (not inferring from status) matters — an "occupied"
// listing might have real rent records and reviews attached if it went
// through your actual booking flow, or might have absolutely nothing if
// the agent just marked it taken after renting off-platform. Status alone
// can't tell the difference; booking history can.
//
// Also deletes the actual Cloudinary images — removing our database row
// alone does NOT free Cloudinary storage, since that's a separate service
// holding the real files.

import { db } from "@/lib/db";
import { listing, booking } from "@/db/schema";
import { eq, and, or, lt, inArray } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import { sendAdminEmail } from "@/lib/send-admin-email";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function cleanupStaleListings(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

  const candidates = await db
    .select({ id: listing.id, images: listing.images })
    .from(listing)
    .where(
      and(
        or(eq(listing.status, "occupied"), eq(listing.status, "temp-unavailable")),
        lt(listing.lastStatusUpdate, cutoff),
      )
    );

  if (candidates.length === 0) return { deleted: 0 };

  const candidateIds = candidates.map((c) => c.id);
  const listingsWithBookings = await db
    .select({ listingId: booking.listingId })
    .from(booking)
    .where(inArray(booking.listingId, candidateIds));

  const haveBookings = new Set(listingsWithBookings.map((b) => b.listingId));
  const safeToDelete = candidates.filter((c) => !haveBookings.has(c.id));

  if (safeToDelete.length === 0) return { deleted: 0 };

  for (const item of safeToDelete) {
    for (const imageUrl of item.images ?? []) {
      try {
        const publicId = extractCloudinaryPublicId(imageUrl);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("[cleanup] Failed to delete Cloudinary image:", imageUrl, err);
      }
    }
  }

  const idsToDelete = safeToDelete.map((c) => c.id);
  await db.delete(listing).where(inArray(listing.id, idsToDelete));

  // Always notify admin when this actually deletes something — irreversible
  // actions happening automatically shouldn't be silent
  sendAdminEmail(
    `Auto-cleanup: ${idsToDelete.length} stale listing${idsToDelete.length > 1 ? "s" : ""} deleted`,
    `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#1B2E1B">Stale listings auto-deleted</h2>
        <p style="color:#374151">${idsToDelete.length} listing${idsToDelete.length > 1 ? "s" : ""} marked occupied or temp-unavailable for 30+ days, with zero booking history, were removed (including their Cloudinary images) to free up space.</p>
        <p style="color:#7A9A7A;font-size:13px">Listing IDs: ${idsToDelete.join(", ")}</p>
      </div>
    `
  ).catch((err) => console.error("[cleanup] Admin notification failed:", err));

  return { deleted: idsToDelete.length };
}

function extractCloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
}