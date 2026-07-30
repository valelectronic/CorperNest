// src/app/(market)/marketplace/my-listings/page.tsx
// Seller's dashboard — all their listings with status, sales count, and actions.
// Server component fetches data, client handles delist and navigation.

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceListing, marketplaceTransaction, marketplaceAvailabilityRequest } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import MyListingsClient from "./my-listings-client";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin?redirect=/marketplace/my-listings");

  // Fetch all listings by this seller
  const listings = await db
    .select({
      id:          marketplaceListing.id,
      title:       marketplaceListing.title,
      category:    marketplaceListing.category,
      condition:   marketplaceListing.condition,
      price:       marketplaceListing.price,
      images:      marketplaceListing.images,
      status:      marketplaceListing.status,
      listingType: marketplaceListing.listingType,
      delivery:    marketplaceListing.delivery,
      createdAt:   marketplaceListing.createdAt,
      expiresAt:   marketplaceListing.expiresAt,
      approvedAt:  marketplaceListing.approvedAt,
    })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.sellerId, session.user.id))
    .orderBy(desc(marketplaceListing.createdAt))
    .catch(() => []);

  // Fetch completed sales count and earnings for this seller
  const salesData = await db
    .select({
      listingId:   marketplaceTransaction.listingId,
      sellerPayout: marketplaceTransaction.sellerPayout,
      status:      marketplaceTransaction.status,
    })
    .from(marketplaceTransaction)
    .where(and(
      eq(marketplaceTransaction.sellerId, session.user.id),
      eq(marketplaceTransaction.status, "released"),
    ))
    .catch(() => []);

  // Map payout totals per listing
  const payoutByListing = salesData.reduce<Record<string, number>>((acc, s) => {
    acc[s.listingId] = (acc[s.listingId] ?? 0) + s.sellerPayout;
    return acc;
  }, {});

  const totalEarned = salesData.reduce((sum, s) => sum + s.sellerPayout, 0);

  const items = listings.map((l) => ({
    ...l,
    price:       l.price / 100,
    images:      l.images ?? [],
    earned:      (payoutByListing[l.id] ?? 0) / 100,
  }));

  // Fetch active availability request IDs for reserving listings
  // So seller can tap directly to the confirm-availability page
  const reservingIds = items.filter((l) => l.status === "reserving").map((l) => l.id);
  const availRequests = reservingIds.length > 0
    ? await db
        .select({ listingId: marketplaceAvailabilityRequest.listingId, id: marketplaceAvailabilityRequest.id })
        .from(marketplaceAvailabilityRequest)
        .where(and(
          inArray(marketplaceAvailabilityRequest.listingId, reservingIds),
          eq(marketplaceAvailabilityRequest.status, "pending"),
        ))
        .catch(() => [])
    : [];

  const availRequestMap = Object.fromEntries(availRequests.map((r) => [r.listingId, r.id]));

  return (
    <MyListingsClient
      listings={items.map((l) => ({ ...l, availRequestId: availRequestMap[l.id] ?? null }))}
      totalEarned={totalEarned / 100}
      completedSales={salesData.length}
    />
  );
}