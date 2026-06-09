// src/app/agent/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, booking, user } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import AgentDashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const agentId   = session.user.id;
  const agentName = session.user.name;

  // ── Unverified agent → send to KYC ───────────────────────────────────────
  const sessionUser = session.user as { agentVerified?: boolean | null };
  if (!sessionUser.agentVerified) redirect("/agent/kyc");

  // ── All active listings for this agent ───────────────────────────────────
  const listings = await db
    .select()
    .from(listing)
    .where(and(eq(listing.agentId, agentId), eq(listing.isActive, true)));

  // ── Auto-expire reserved listings older than 24hrs ────────────────────────
  // If a listing has been reserved for 24+ hours, flip it back to available
  // This handles cases where visit day passed without CNV verification
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const toExpire = listings.filter(
    (l) => l.status === "reserved" && new Date(l.lastStatusUpdate) < twentyFourHoursAgo
  );

  if (toExpire.length > 0) {
    const expireIds = toExpire.map((l) => l.id);
    await db
      .update(listing)
      .set({ status: "available", lastStatusUpdate: new Date(), updatedAt: new Date() })
      .where(inArray(listing.id, expireIds));

    // Update in-memory array so the dashboard shows correct status
    toExpire.forEach((l) => { l.status = "available"; });
  }

  // ── Incoming bookings (pending + scheduled) ───────────────────────────────
  const allBookings = await db
    .select({
      id:          booking.id,
      bookingCode: booking.bookingCode,
      status:      booking.status,
      agreedDate:  booking.agreedDate,
      agreedTime:  booking.agreedTime,
      listingId:   booking.listingId,
      renterId:    booking.renterId,
      renterName:  user.name,
      renterPhone: user.phone,
      renterEmail: user.email,
    })
    .from(booking)
    .innerJoin(user, eq(booking.renterId, user.id))
    .where(eq(booking.agentId, agentId));

  // Filter in JS — show pending + scheduled only
  const activeBookings = allBookings.filter(
    (b) => b.status === "pending" || b.status === "scheduled"
  );

  // ── Listing health checks ─────────────────────────────────────────────────

  // Expiring soon — lastStatusUpdate older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const expiringListings = listings.filter(
    (l) => new Date(l.lastStatusUpdate) <= sevenDaysAgo
  );

  // Stale — not updated in 5+ days (for availability reminder)
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const staleListings = listings.filter(
    (l) => new Date(l.lastStatusUpdate) <= fiveDaysAgo
  );

  // ── Completed bookings count ──────────────────────────────────────────────
  const completedBookings = await db
    .select({ id: booking.id })
    .from(booking)
    .where(and(eq(booking.agentId, agentId), eq(booking.status, "completed")));

  return (
    <AgentDashboardClient
      agentName={agentName}
      listings={listings}
      incomingBookings={activeBookings}
      expiringListings={expiringListings}
      staleListings={staleListings}
      completedCount={completedBookings.length}
    />
  );
}