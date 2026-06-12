import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import AdminListingsClient from "./listings-client";

export const dynamic = "force-dynamic";

async function getPendingListings() {
  const rows = await db
    .select({
      id:           listing.id,
      title:        listing.title,
      description:  listing.description,
      address:      listing.address,
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

  return <AdminListingsClient pending={pending} recentlyDeclined={recentlyDeclined} />;
}