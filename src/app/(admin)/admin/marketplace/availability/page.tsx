// src/app/admin/marketplace/availability/page.tsx
// Admin view of all pending availability requests.
// Admin can confirm or cancel on seller's behalf.
// Shows seller + buyer phone numbers as tap-to-call links.

import { db } from "@/lib/db";
import { marketplaceAvailabilityRequest, marketplaceListing, user } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import AdminAvailabilityClient from "./availability-client";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const rows = await db
    .select({
      id:           marketplaceAvailabilityRequest.id,
      listingId:    marketplaceAvailabilityRequest.listingId,
      buyerId:      marketplaceAvailabilityRequest.buyerId,
      sellerId:     marketplaceAvailabilityRequest.sellerId,
      agreedPrice:  marketplaceAvailabilityRequest.agreedPrice,
      status:       marketplaceAvailabilityRequest.status,
      expiresAt:    marketplaceAvailabilityRequest.expiresAt,
      createdAt:    marketplaceAvailabilityRequest.createdAt,
      listingTitle: marketplaceListing.title,
      listingImage: marketplaceListing.images,
      sellerName:   user.name,
      sellerPhone:  user.phoneNumber,
    })
    .from(marketplaceAvailabilityRequest)
    .innerJoin(marketplaceListing, eq(marketplaceAvailabilityRequest.listingId, marketplaceListing.id))
    .innerJoin(user, eq(marketplaceAvailabilityRequest.sellerId, user.id))
    .where(inArray(marketplaceAvailabilityRequest.status, ["pending", "confirmed"]))
    .orderBy(desc(marketplaceAvailabilityRequest.createdAt))
    .catch(() => []);

  // Fetch buyer details separately
  const buyerIds = [...new Set(rows.map((r) => r.buyerId))];
  const buyers   = buyerIds.length > 0
    ? await db.select({ id: user.id, name: user.name, phone: user.phoneNumber })
        .from(user)
        .where(inArray(user.id, buyerIds))
        .catch(() => [])
    : [];

  const buyerMap = Object.fromEntries(buyers.map((b) => [b.id, b]));

  const requests = rows.map((r) => ({
    ...r,
    agreedPrice:  r.agreedPrice / 100,
    expiresAtMs:  new Date(r.expiresAt).getTime(),
    listingImage: (r.listingImage ?? [])[0] ?? null,
    buyerName:    buyerMap[r.buyerId]?.name ?? null,
    buyerPhone:   buyerMap[r.buyerId]?.phone ?? null,
  }));

  return <AdminAvailabilityClient requests={requests} />;
}