import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, watchlist } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

// Status priority — available first, occupied last
// Matches the feed route ordering so both pages are consistent
const STATUS_ORDER = sql`CASE
  WHEN ${listing.status} = 'available'        THEN 1
  WHEN ${listing.status} = 'reserved'         THEN 2
  WHEN ${listing.status} = 'temp-unavailable' THEN 3
  WHEN ${listing.status} = 'occupied'         THEN 4
  ELSE 5
END`;

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/signin");

  const userId = session.user.id;
  const userName = session.user.name;

  // Fetch first page — ALL statuses, Akwa Ibom default
  // Available listings float to top via STATUS_ORDER
  const listings = await db
    .select()
    .from(listing)
    .where(
      and(
        eq(listing.isActive, true),
        eq(listing.state, "Akwa Ibom"),
      )
    )
    .orderBy(STATUS_ORDER, listing.createdAt)
    .limit(PAGE_SIZE);

  // Count total active listings for pagination
  // Lightweight — only fetches IDs
  const allListings = await db
    .select({ id: listing.id })
    .from(listing)
    .where(
      and(
        eq(listing.isActive, true),
        eq(listing.state, "Akwa Ibom"),
      )
    );

  // Fetch corper's watchlisted IDs so hearts render correctly on load
  const watchlisted = await db
    .select({ listingId: watchlist.listingId })
    .from(watchlist)
    .where(eq(watchlist.renterId, userId));

  const watchlistedIds = new Set(watchlisted.map((w) => w.listingId));

  return (
    <HomeClient
      userName={userName}
      initialListings={listings}
      totalCount={allListings.length}
      pageSize={PAGE_SIZE}
      watchlistedIds={Array.from(watchlistedIds)}
    />
  );
}