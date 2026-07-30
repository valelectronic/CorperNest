// src/app/(market)/marketplace/store/[sellerId]/page.tsx
// Public seller store — shows all active listings by this seller.
// Accessible without login. Linked from listing detail "View store" button.

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { marketplaceListing, marketplaceTransaction, user } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import MarketplaceStoreClient from "./store-client";

export const dynamic = "force-dynamic";

export default async function SellerStorePage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;

  // Fetch seller profile
  const [seller] = await db
    .select({
      id:              user.id,
      name:            user.name,
      marketVendorTier:   user.marketVendorTier,
      marketSellerVerified: user.marketSellerVerified,
      createdAt:       user.createdAt,
    })
    .from(user)
    .where(eq(user.id, sellerId))
    .limit(1);

  if (!seller) notFound();

  // Fetch active listings + completed sales count in parallel
  const [listings, salesResult] = await Promise.all([
    db.select({
      id:          marketplaceListing.id,
      title:       marketplaceListing.title,
      category:    marketplaceListing.category,
      condition:   marketplaceListing.condition,
      price:       marketplaceListing.price,
      images:      marketplaceListing.images,
      status:      marketplaceListing.status,
      listingType: marketplaceListing.listingType,
      lga:         marketplaceListing.lga,
      state:       marketplaceListing.state,
      landmark:    marketplaceListing.landmark,
      createdAt:   marketplaceListing.createdAt,
      refPriceMin: marketplaceListing.refPriceMin,
    })
    .from(marketplaceListing)
    .where(and(
      eq(marketplaceListing.sellerId, sellerId),
      eq(marketplaceListing.status, "active"),
    ))
    .orderBy(desc(marketplaceListing.approvedAt))
    .catch(() => []),

    db.select({ value: count() })
      .from(marketplaceTransaction)
      .where(and(
        eq(marketplaceTransaction.sellerId, sellerId),
        eq(marketplaceTransaction.status, "released"),
      ))
      .catch(() => [{ value: 0 }]),
  ]);

  const completedSales = salesResult[0]?.value ?? 0;

  const items = listings.map((l) => ({
    ...l,
    price:       l.price / 100,
    refPriceMin: l.refPriceMin ? l.refPriceMin / 100 : null,
    images:      l.images ?? [],
  }));

  return (
    <MarketplaceStoreClient
      seller={{
        id:        seller.id,
        name:      seller.name ?? "Seller",
        verified:  seller.marketSellerVerified ?? false,
        tier:      seller.marketVendorTier ?? "basic",
        joinedAt:  seller.createdAt,
      }}
      listings={items}
      completedSales={completedSales}
    />
  );
}