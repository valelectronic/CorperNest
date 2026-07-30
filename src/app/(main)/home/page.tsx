import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, watchlist } from "@/db/schema";
import { and, eq, sql, desc, notInArray, count } from "drizzle-orm";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

// Available listings float to top, reserved/occupied shown below
const STATUS_ORDER = sql`CASE
  WHEN ${listing.status} = 'available'         THEN 1
  WHEN ${listing.status} = 'reserved'          THEN 2
  WHEN ${listing.status} = 'occupied'          THEN 3
  WHEN ${listing.status} = 'temp-unavailable'  THEN 4
  ELSE 5
END`;

// Only hide admin-internal statuses
const HIDDEN_STATUSES = ["under-review", "flagged", "needs-correction"];

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  const userId   = session?.user.id   ?? null;
  const userName = session?.user.name ?? null;

  // Run first page + total count + watchlist in parallel
  // count() is one number — no longer fetching all IDs
  const [listings, [{ value: totalCount }], watchlisted] = await Promise.all([
    db.select()
      .from(listing)
      .where(and(
        eq(listing.isActive, true),
        eq(listing.state, "Akwa Ibom"),
        notInArray(listing.status, HIDDEN_STATUSES),
      ))
      .orderBy(STATUS_ORDER, desc(listing.createdAt))
      .limit(PAGE_SIZE),

    db.select({ value: count() })
      .from(listing)
      .where(and(
        eq(listing.isActive, true),
        eq(listing.state, "Akwa Ibom"),
        notInArray(listing.status, HIDDEN_STATUSES),
      )),

    userId
      ? db.select({ listingId: watchlist.listingId })
          .from(watchlist)
          .where(eq(watchlist.renterId, userId))
      : Promise.resolve([]),
  ]);

  const watchlistedIds = new Set(watchlisted.map((w) => w.listingId));

  return (
    <HomeClient
      userName={userName}
      initialListings={listings}
      totalCount={totalCount}
      watchlistedIds={Array.from(watchlistedIds)}
    />
  );
}