// src/app/admin/listings/page.tsx
import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq, desc, notInArray } from "drizzle-orm";
import AdminListingsClient from "./listings-client";

export const revalidate = 30;

export default async function AdminListingsPage() {
  const [pending, recentlyDeclined, active] = await Promise.all([

    // Pending — awaiting review
    db.select({
      id:               listing.id,
      title:            listing.title,
      description:      listing.description,
      address:          listing.address,
      landmark:         listing.landmark,
      lga:              listing.lga,
      state:            listing.state,
      price:            listing.price,
      type:             listing.type,
      listingPurpose:   listing.listingPurpose,
      status:           listing.status,
      images:           listing.images,
      amenities:        listing.amenities,
      customAmenities:  listing.customAmenities,
      agencyFeePercent: listing.agencyFeePercent,
      createdAt:        listing.createdAt,
      agentId:          listing.agentId,
      agentName:        user.name,
      agentEmail:       user.email,
      agentPhone:       user.phone,
    })
    .from(listing)
    .innerJoin(user, eq(listing.agentId, user.id))
    .where(eq(listing.status, "under-review"))
    .orderBy(desc(listing.createdAt)),

    // Recently flagged/declined
    db.select({
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
    .limit(10),

    // Active listings — admin can delete or flag any of these
    db.select({
      id:        listing.id,
      title:     listing.title,
      price:     listing.price,
      status:    listing.status,
      type:      listing.type,
      lga:       listing.lga,
      images:    listing.images,
      createdAt: listing.createdAt,
      agentName: user.name,
      agentId:   listing.agentId,
    })
    .from(listing)
    .innerJoin(user, eq(listing.agentId, user.id))
    .where(notInArray(listing.status, ["under-review", "flagged"]))
    .orderBy(desc(listing.createdAt))
    .limit(100),
  ]);

  return (
    <AdminListingsClient
      pending={pending}
      recentlyDeclined={recentlyDeclined}
      active={active}
    />
  );
}