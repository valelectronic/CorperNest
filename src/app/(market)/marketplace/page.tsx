// src/app/(market)/marketplace/page.tsx
// Marketplace browse feed — publicly accessible, no login required
// Server component fetches first page, client handles search/filter/pagination

import { db } from "@/lib/db";
import { marketplaceListing, user } from "@/db/schema";
import { and, eq, gte, isNull, or, desc } from "drizzle-orm";
import MarketplaceClient from "./marketplace-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function MarketplacePage() {
  const now = new Date();

  // Get session for phone verification check — no extra DB query, uses existing session
  const session    = await auth.api.getSession({ headers: await headers() });
  const sessionUser = session?.user as { phoneNumber?: string | null; phoneNumberVerified?: boolean } | undefined;
  const hasVerifiedPhone = !!(sessionUser?.phoneNumber || sessionUser?.phoneNumberVerified);

  const rows = await db
    .select({
      id:               marketplaceListing.id,
      listingType:      marketplaceListing.listingType,
      title:            marketplaceListing.title,
      category:         marketplaceListing.category,
      condition:        marketplaceListing.condition,
      price:            marketplaceListing.price,
      refPriceMin:      marketplaceListing.refPriceMin,
      state:            marketplaceListing.state,
      lga:              marketplaceListing.lga,
      landmark:         marketplaceListing.landmark,
      images:           marketplaceListing.images,
      bundleItems:      marketplaceListing.bundleItems,
      status:           marketplaceListing.status,
      createdAt:        marketplaceListing.createdAt,
      expiresAt:        marketplaceListing.expiresAt,
      sellerName:       user.name,
      sellerVendorTier: user.marketVendorTier,
      sellerVerified:   user.marketSellerVerified,
    })
    .from(marketplaceListing)
    .innerJoin(user, eq(marketplaceListing.sellerId, user.id))
    .where(
      and(
        eq(marketplaceListing.status, "active"),
        or(
          isNull(marketplaceListing.expiresAt),
          gte(marketplaceListing.expiresAt, now),
        )!
      )
    )
    .orderBy(desc(marketplaceListing.approvedAt))
    .limit(PAGE_SIZE + 1)
    .catch(() => []);

  const hasMore        = rows.length > PAGE_SIZE;
  const initialListings = rows.slice(0, PAGE_SIZE).map((r) => ({
  ...r,
  price:       r.price / 100,
  refPriceMin: r.refPriceMin ? r.refPriceMin / 100 : null,
  images:      r.images ?? [],
  bundleItems: r.bundleItems ?? [],
}));

  return (
    <MarketplaceClient
      initialListings={initialListings}
      hasMoreInitial={hasMore}
      hasVerifiedPhone={hasVerifiedPhone}
    />
  );
}