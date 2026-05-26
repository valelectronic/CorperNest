import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { and, eq, gte, lte, ilike, or, sql } from "drizzle-orm";

const PAGE_SIZE = 10;

// Status priority order — available first, occupied last
// Used in ORDER BY so corpers see available properties at the top
const STATUS_ORDER = sql`CASE
  WHEN ${listing.status} = 'available'         THEN 1
  WHEN ${listing.status} = 'reserved'          THEN 2
  WHEN ${listing.status} = 'temp-unavailable'  THEN 3
  WHEN ${listing.status} = 'occupied'          THEN 4
  ELSE 5
END`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page     = Math.max(1, parseInt(searchParams.get("page")     ?? "1"));
  const state    = searchParams.get("state")    ?? "Akwa Ibom";
  const lga      = searchParams.get("lga")      ?? "";
  const type     = searchParams.get("type")     ?? "";
  const purpose  = searchParams.get("purpose")  ?? "";
  const minPrice = parseInt(searchParams.get("minPrice") ?? "0");
  const maxPrice = parseInt(searchParams.get("maxPrice") ?? "0");
  const keyword  = searchParams.get("keyword")  ?? "";
  const offset   = (page - 1) * PAGE_SIZE;

  // Always required — only active listings
  const conditions = [
    eq(listing.isActive, true),
    eq(listing.state, state),
  ];

  // Optional filters — only added if provided
  if (lga)            conditions.push(eq(listing.lga, lga));
  if (type)           conditions.push(eq(listing.type, type));
  if (purpose)        conditions.push(eq(listing.listingPurpose, purpose));
  if (minPrice > 0)   conditions.push(gte(listing.price, minPrice));
  if (maxPrice > 0)   conditions.push(lte(listing.price, maxPrice));
  if (keyword.trim()) {
    conditions.push(
      or(
        ilike(listing.title, `%${keyword.trim()}%`),
        ilike(listing.description, `%${keyword.trim()}%`),
      )!
    );
  }

  try {
    // Single query — no separate count query
    // We fetch PAGE_SIZE + 1 rows to check if more pages exist
    // If we get 11 rows, there's a next page. We return only 10.
    // This saves one entire DB round trip per request.
    const rows = await db
      .select()
      .from(listing)
      .where(and(...conditions))
      .orderBy(STATUS_ORDER, listing.createdAt)
      .limit(PAGE_SIZE + 1)
      .offset(offset);

    const hasMore = rows.length > PAGE_SIZE;
    const listings = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    // Cache response for 60 seconds — same filters within 60s
    // returns cached response, zero extra DB hits
    // On Nigerian 3G this also speeds up repeat loads significantly
    return NextResponse.json(
      { listings, hasMore, page, pageSize: PAGE_SIZE },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[properties/feed] DB error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings." },
      { status: 500 }
    );
  }
}