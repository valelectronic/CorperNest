// src/app/agent/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, booking, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import AgentDashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const agentId   = session.user.id;
  const agentName = session.user.name;

  // All active listings for this agent
  const listings = await db
    .select()
    .from(listing)
    .where(and(eq(listing.agentId, agentId), eq(listing.isActive, true)));

  // Incoming bookings — pending (payment done, no date yet) + scheduled (date set)
  // Join with user table to get corper name and phone
  const incomingBookings = await db
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
    .where(
      and(
        eq(booking.agentId, agentId),
        // show pending + scheduled — not completed/cancelled/verified
      )
    );

  // Filter in JS to avoid complex OR in drizzle without helper
  const activeBookings = incomingBookings.filter(
    (b) => b.status === "pending" || b.status === "scheduled"
  );

  // Listings expiring soon (lastStatusUpdate older than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const expiringListings = listings.filter(
    (l) => new Date(l.lastStatusUpdate) <= sevenDaysAgo
  );

  // Stale listings (not updated in 5+ days)
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
      incomingBookings={activeBookings}
      expiringListings={expiringListings}
      staleListings={staleListings}
      completedCount={completedBookings.length}
    />
  );
}