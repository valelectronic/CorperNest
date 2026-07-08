// src/app/admin/bookings/page.tsx
//
// Admin bookings control — shows all active bookings with full details.
// Separate from /admin/bookings/pending which is the approval queue.
// This is the operational view: who has visited, who hasn't, commission status.

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, listing, user } from "@/db/schema";
import { eq, desc, inArray, lt, and } from "drizzle-orm";
import { headers } from "next/headers";
import AdminBookingsClient from "./bookings-client";

export const revalidate = 60;
export const dynamic    = "force-dynamic";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export default async function AdminBookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) redirect("/home");

  // ── 30-day auto-cleanup ───────────────────────────────────────────────────
  // Runs on every page load. Deletes bookings with no activity for 30+ days.
  // "No activity" means updatedAt hasn't changed in 30 days.
  // This keeps the admin view clean without needing a cron job.
  // Vercel Hobby has no scheduled functions, so lazy cleanup on page load
  // is the right approach at this scale.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await db
    .delete(booking)
    .where(
      and(
        lt(booking.updatedAt, thirtyDaysAgo),
        inArray(booking.status, ["verified", "completed", "cancelled"])
      )
    );

  // ── Fetch active bookings ──────────────────────────────────────────────────
  const rows = await db
    .select({
      id:               booking.id,
      bookingCode:      booking.bookingCode,
      status:           booking.status,
      createdAt:        booking.createdAt,
      renterId:         booking.renterId,
      agentId:          booking.agentId,
      listingId:        booking.listingId,
      commissionStatus: booking.commissionStatus,
      listingTitle:     listing.title,
      listingLga:       listing.lga,
      listingImages:    listing.images,
      listingStatus:    listing.status,
    })
    .from(booking)
    .innerJoin(listing, eq(booking.listingId, listing.id))
    .where(inArray(booking.status, ["pending", "verified", "completed"]))
    .orderBy(desc(booking.createdAt))
    .limit(100);

  // Fetch all unique clients and agents in two queries
  const renterIds = [...new Set(rows.map((r) => r.renterId))];
  const agentIds  = [...new Set(rows.map((r) => r.agentId))];

  const [renters, agents] = await Promise.all([
    renterIds.length > 0
      ? db.select({ id: user.id, name: user.name, phone: user.phone, phoneNumber: user.phoneNumber })
          .from(user).where(inArray(user.id, renterIds))
      : [],
    agentIds.length > 0
      ? db.select({ id: user.id, name: user.name, phone: user.phone, phoneNumber: user.phoneNumber })
          .from(user).where(inArray(user.id, agentIds))
      : [],
  ]);

  const renterMap = Object.fromEntries(renters.map((u) => [u.id, u]));
  const agentMap  = Object.fromEntries(agents.map((u) => [u.id, u]));

  const bookings = rows.map((r) => ({
    ...r,
    clientName:  renterMap[r.renterId]?.name ?? "Unknown",
    clientPhone: renterMap[r.renterId]?.phoneNumber ?? renterMap[r.renterId]?.phone ?? null,
    agentName:   agentMap[r.agentId]?.name  ?? "Unknown",
    agentPhone:  agentMap[r.agentId]?.phoneNumber  ?? agentMap[r.agentId]?.phone  ?? null,
  }));

  return <AdminBookingsClient bookings={bookings} />;
}