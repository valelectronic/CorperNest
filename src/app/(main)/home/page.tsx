import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, watchlist } from "@/db/schema";
import { and, eq, desc, notInArray } from "drizzle-orm";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

// Only available listings are shown publicly.
// reserved        → someone has an active booking — off market
// occupied        → property is rented — nothing to book
// temp-unavailable → agent made it unavailable
// under-review    → awaiting admin approval
// flagged         → flagged by admin
// needs-correction → sent back to agent for edits
const HIDDEN_STATUSES = [
  "under-review",
  "flagged",
  "needs-correction",
  "reserved",
  "occupied",
  "temp-unavailable",
];

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
    .orderBy(desc(listing.createdAt)) // newest available listings first
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