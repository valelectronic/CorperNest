// src/app/api/cron/marketplace-cleanup/route.ts
// Vercel Cron — runs daily at 2am
// Processes max 50 expired listings per run to stay within 10s Vercel timeout
// At 50 listings × 3 photos × 400ms = ~60s worst case — limit keeps us safe
// Listings expired more than 7 days ago with status "active" are hard deleted

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketplaceListing, notification, marketplaceAvailabilityRequest, marketplaceTransaction } from "@/db/schema";
import { and, lt, isNotNull, eq, lte } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_MARKET!,
  api_key:    process.env.CLOUDINARY_API_KEY_MARKET!,
  api_secret: process.env.CLOUDINARY_API_SECRET_MARKET!,
});

const BATCH_LIMIT = 50; // never process more than 50 per cron run

function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]{2,4})?$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Grace period: 7 days past expiry
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const expired = await db
    .select({ id: marketplaceListing.id, images: marketplaceListing.images })
    .from(marketplaceListing)
    .where(
      and(
        isNotNull(marketplaceListing.expiresAt),
        lt(marketplaceListing.expiresAt, cutoff),
        eq(marketplaceListing.status, "active")
      )
    )
    .limit(BATCH_LIMIT); // safety cap — never times out

  if (expired.length === 0) {
    return NextResponse.json({ deleted: 0, message: "Nothing to clean up" });
  }

  let deleted = 0;
  let skipped = 0;

  for (const listing of expired) {
    try {
      const images    = listing.images ?? [];
      const publicIds = images.map(extractPublicId).filter(Boolean) as string[];

      // Delete images from Cloudinary in parallel
      if (publicIds.length > 0) {
        await Promise.allSettled(
          publicIds.map((pid) => cloudinary.uploader.destroy(pid))
        );
      }

      // Hard delete from Neon
      await db
        .delete(marketplaceListing)
        .where(eq(marketplaceListing.id, listing.id));

      deleted++;
    } catch (err) {
      console.error(`[cleanup] Failed ${listing.id}:`, err);
      skipped++;
    }
  }

  // ── Clean up read notifications older than 14 days ────────────────────────
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const { rowCount: notifDeleted } = await db
    .delete(notification)
    .where(and(
      eq(notification.read, true),
      lte(notification.createdAt, fourteenDaysAgo),
    ));

  // ── Clean up expired/denied availability requests older than 7 days ───────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await db.delete(marketplaceAvailabilityRequest)
    .where(and(
      lte(marketplaceAvailabilityRequest.createdAt, sevenDaysAgo),
    ));

  // ── Clean up abandoned pending transactions older than 2 days ─────────────
  // These are transactions where buyer started checkout but never completed
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  await db.update(marketplaceTransaction)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(
      eq(marketplaceTransaction.status, "pending"),
      lte(marketplaceTransaction.createdAt, twoDaysAgo),
    ));

  return NextResponse.json({ deleted, skipped, batchLimit: BATCH_LIMIT, notifDeleted: notifDeleted ?? 0 });
}