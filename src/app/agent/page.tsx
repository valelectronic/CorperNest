import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, booking } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import AgentDashboardClient from "./dashboard-client";

// Force Next.js to always fetch fresh data on every request
// Without this, Vercel caches the page and listings appear stale
export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/signin");

  const agentId = session.user.id;
  const agentName = session.user.name;

  // All active listings for this agent
  const listings = await db
    .select()
    .from(listing)
    .where(and(eq(listing.agentId, agentId), eq(listing.isActive, true)));

  // All pending bookings for this agent
  const pendingBookings = await db
    .select({
      id: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      visitDate: booking.visitDate,
      listingId: booking.listingId,
      renterId: booking.renterId,
    })
    .from(booking)
    .where(and(eq(booking.agentId, agentId), eq(booking.status, "pending")));

  // Listings expiring soon (lastStatusUpdate older than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const expiringListings = listings.filter(
    (l) => new Date(l.lastStatusUpdate) <= sevenDaysAgo
  );

  // Stale listings (not updated in 5+ days) for reminder box
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const staleListings = listings.filter(
    (l) => new Date(l.lastStatusUpdate) <= fiveDaysAgo
  );

  // Completed bookings count
  const completedBookings = await db
    .select({ id: booking.id })
    .from(booking)
    .where(and(eq(booking.agentId, agentId), eq(booking.status, "completed")));

  return (
    <AgentDashboardClient
      agentName={agentName}
      listings={listings}
      pendingBookings={pendingBookings}
      expiringListings={expiringListings}
      staleListings={staleListings}
      completedCount={completedBookings.length}
    />
  );
}