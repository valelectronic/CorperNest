import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import AdminListingsClient from "./listings-client";

export const revalidate = 30;

async function getPendingListings() {
  const rows = await db
    .select({
      id:           listing.id,
      title:        listing.title,
      description:  listing.description,
      address:      listing.address,
      landmark:       listing.landmark, 
      lga:          listing.lga,
      state:        listing.state,
      price:        listing.price,
      type:         listing.type,
      listingPurpose: listing.listingPurpose,
      status:       listing.status,
      images:       listing.images,
      amenities:    listing.amenities,
      createdAt:    listing.createdAt,
      agentId:      listing.agentId,
      agentName:    user.name,
      agentEmail:   user.email,
      agentPhone:   user.phone,
    })
    .from(listing)
    .innerJoin(user, eq(listing.agentId, user.id))
    .where(eq(listing.status, "under-review"))
    .orderBy(desc(listing.createdAt));

  return rows;
}

async function getRecentlyReviewed() {
  const rows = await db
    .select({
      id:        listing.id,
      title:     listing.title,
      status:    listing.status,
      updatedAt: listing.updatedAt,
      agentName: user.name,
    })
    .from(listing)
    .innerJoin(user, eq(listing.agentId, user.id))
    .where(eq(listing.status, "flagged"))
    .orderBy(desc(listing.updatedAt))
    .limit(10);

  return rows;
}

export default async function AdminListingsPage() {
  const [pending, recentlyDeclined] = await Promise.all([
    getPendingListings(),
    getRecentlyReviewed(),
  ]);

  // Check duplicates for each pending listing
  const { ilike, and, eq: deq, notInArray } = await import("drizzle-orm");
  const pendingWithDuplicates = await Promise.all(
    pending.map(async (l) => {
      if (!l.landmark || !l.type || !l.lga) return { ...l, possibleDuplicate: false };
      try {
        const dupes = await db
          .select({ id: listing.id })
          .from(listing)
          .where(
            and(
              deq(listing.lga, l.lga),
              deq(listing.type, l.type),
              deq(listing.isActive, true),
              notInArray(listing.status, ["under-review", "flagged"]),
              ilike(listing.landmark, `%${l.landmark.slice(0, 20)}%`),
            )
          )
          .limit(1);
        return { ...l, possibleDuplicate: dupes.length > 0 };
      } catch {
        return { ...l, possibleDuplicate: false };
      }
    })
  );

  return <AdminListingsClient pending={pendingWithDuplicates} recentlyDeclined={recentlyDeclined} />;
}