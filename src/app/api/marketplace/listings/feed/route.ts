// src/app/api/marketplace/listings/feed/route.ts
// Returns active marketplace listings for the browse feed
// Supports filtering by category, condition, state, lga, price, keyword, listingType
// Only returns status=active listings that have not expired
// Joins seller info — name, vendor tier, verified status

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketplaceListing, user } from "@/db/schema";
import { and, eq, ilike, gte, lte, desc, ne, or, isNull } from "drizzle-orm";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page        = Math.max(1, Number(searchParams.get("page") ?? 1));
  const category    = searchParams.get("category") ?? "";
  const condition   = searchParams.get("condition") ?? "";
  const state       = searchParams.get("state") ?? "";
  const lga         = searchParams.get("lga") ?? "";
  const minPrice    = searchParams.get("minPrice") ?? "";
  const maxPrice    = searchParams.get("maxPrice") ?? "";
  const keyword     = searchParams.get("keyword") ?? "";
  const listingType = searchParams.get("listingType") ?? "";

  const now = new Date();

  try {
    const conditions = [
      eq(marketplaceListing.status, "active"),
      or(
        isNull(marketplaceListing.expiresAt),
        gte(marketplaceListing.expiresAt, now),
      )!,
    ];

    if (category)    conditions.push(eq(marketplaceListing.category,    category));
    if (condition)   conditions.push(eq(marketplaceListing.condition,   condition));
    if (state)       conditions.push(eq(marketplaceListing.state,       state));
    if (lga)         conditions.push(eq(marketplaceListing.lga,         lga));
    if (listingType) conditions.push(eq(marketplaceListing.listingType, listingType));
    if (minPrice)    conditions.push(gte(marketplaceListing.price, Number(minPrice) * 100));
    if (maxPrice)    conditions.push(lte(marketplaceListing.price, Number(maxPrice) * 100));
    if (keyword)     conditions.push(
      or(
        ilike(marketplaceListing.title,       `%${keyword}%`),
        ilike(marketplaceListing.description, `%${keyword}%`),
        ilike(marketplaceListing.landmark,    `%${keyword}%`),
      )!
    );

    const where = and(...conditions);

    const rows = await db
      .select({
        id:          marketplaceListing.id,
        listingType: marketplaceListing.listingType,
        title:       marketplaceListing.title,
        category:    marketplaceListing.category,
        condition:   marketplaceListing.condition,
        price:       marketplaceListing.price,
        state:       marketplaceListing.state,
        lga:         marketplaceListing.lga,
        landmark:    marketplaceListing.landmark,
        images:      marketplaceListing.images,
        bundleItems: marketplaceListing.bundleItems,
        status:      marketplaceListing.status,
        createdAt:   marketplaceListing.createdAt,
        expiresAt:   marketplaceListing.expiresAt,
        sellerName:      user.name,
        sellerVendorTier: user.marketVendorTier,
        sellerVerified:   user.marketSellerVerified,
        refPriceMin:      marketplaceListing.refPriceMin,
      })
      .from(marketplaceListing)
      .innerJoin(user, eq(marketplaceListing.sellerId, user.id))
      .where(where)
      .orderBy(desc(marketplaceListing.approvedAt))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE);

    const hasMore  = rows.length > PAGE_SIZE;
    const listings = rows.slice(0, PAGE_SIZE).map((r) => ({
      ...r,
      price:        r.price / 100,
      refPriceMin:  r.refPriceMin ? r.refPriceMin / 100 : null,
      images:    r.images ?? [],
      bundleItems: r.bundleItems ?? [],
    }));

    return NextResponse.json({ listings, hasMore, page });
  } catch (err) {
    console.error("[marketplace/feed]", err);
    return NextResponse.json({ listings: [], hasMore: false, page: 1 });
  }
}