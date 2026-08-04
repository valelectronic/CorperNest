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
      listingId:    marketplaceTransaction.listingId,
      sellerPayout: marketplaceTransaction.sellerPayout,
      status:       marketplaceTransaction.status,
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
    price:  l.price / 100,
    images: l.images ?? [],
    earned: (payoutByListing[l.id] ?? 0) / 100,
  }));

  // Fetch availability request IDs for reserving listings
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

  // ── Fetch waybill data for reserved listings (payment in escrow) ──────────
  // Only reserved listings need waybill — seller ships after buyer pays
  const reservedIds = items.filter((l) => l.status === "reserved").map((l) => l.id);
  const escrowTxns = reservedIds.length > 0
    ? await db
        .select({
          listingId:      marketplaceTransaction.listingId,
          id:             marketplaceTransaction.id,
          waybillDetails: marketplaceTransaction.waybillDetails,
          shippedAt:      marketplaceTransaction.shippedAt,
        })
        .from(marketplaceTransaction)
        .where(and(
          eq(marketplaceTransaction.sellerId, session.user.id),
          eq(marketplaceTransaction.status, "escrow"),
          inArray(marketplaceTransaction.listingId, reservedIds),
        ))
        .catch(() => [])
    : [];

  // Map transaction data by listing ID
  const txnByListing = Object.fromEntries(escrowTxns.map((t) => [t.listingId, t]));

  return (
    <MyListingsClient
      listings={items.map((l) => ({
        ...l,
        availRequestId: availRequestMap[l.id] ?? null,
        // Waybill data — only populated for reserved listings with active escrow
        transactionId:  txnByListing[l.id]?.id             ?? null,
        waybillDetails: txnByListing[l.id]?.waybillDetails ?? null,
        shippedAt:      txnByListing[l.id]?.shippedAt      ?? null,
      }))}
      totalEarned={totalEarned / 100}
      completedSales={salesData.length}
    />
  );
}