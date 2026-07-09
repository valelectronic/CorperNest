import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, watchlist } from "@/db/schema";
import { and, eq, sql, desc, notInArray } from "drizzle-orm";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

// Available listings float to top, reserved/occupied shown below
// so clients can see everything but available ones are always first
const STATUS_ORDER = sql`CASE
  WHEN ${listing.status} = 'available'         THEN 1
  WHEN ${listing.status} = 'reserved'          THEN 2
  WHEN ${listing.status} = 'occupied'          THEN 3
  WHEN ${listing.status} = 'temp-unavailable'  THEN 4
  ELSE 5
END`;

// Only hide admin-internal statuses — clients never need to see these
const HIDDEN_STATUSES = ["under-review", "flagged", "needs-correction"];

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const userId   = session.user.id;
  const userName = session.user.name;

  const listings = await db
    .select()
    .from(listing)
    .where(
      and(
        eq(listing.isActive, true),
        eq(listing.state, "Akwa Ibom"),
        notInArray(listing.status, HIDDEN_STATUSES),
      )
    )
    .orderBy(STATUS_ORDER, desc(listing.createdAt))
    .limit(PAGE_SIZE);

  const allListings = await db
    .select({ id: listing.id })
    .from(listing)
    .where(
      and(
        eq(listing.isActive, true),
        eq(listing.state, "Akwa Ibom"),
        notInArray(listing.status, HIDDEN_STATUSES),
      )
    );

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