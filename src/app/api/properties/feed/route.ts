import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { and, eq, gte, lte, ilike, or, notInArray, desc } from "drizzle-orm";

const PAGE_SIZE = 10;

// Only available listings shown publicly.
// reserved        → active booking exists — off market
// occupied        → rented — nothing to book
// temp-unavailable → agent made it unavailable
// under-review    → awaiting admin approval
// flagged         → flagged by admin
// needs-correction → sent back to agent for edits
const HIDDEN_STATUSES = [
  "under-review",
  "flagged",
  "needs-correction",
  "reserved",
  "occupied",
  "temp-unavailable",
];

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

  const conditions = [
    eq(listing.isActive, true),
    eq(listing.state, state),
    notInArray(listing.status, HIDDEN_STATUSES),
  ];

  if (lga)            conditions.push(eq(listing.lga, lga));
  if (type)           conditions.push(eq(listing.type, type));
  if (purpose)        conditions.push(eq(listing.listingPurpose, purpose));
  if (minPrice > 0)   conditions.push(gte(listing.price, minPrice));
  if (maxPrice > 0)   conditions.push(lte(listing.price, maxPrice));
  if (keyword.trim()) {
    conditions.push(
      or(
        ilike(listing.title,       `%${keyword.trim()}%`),
        ilike(listing.description, `%${keyword.trim()}%`),
      )!
    );
  }

  try {
    const rows = await db
      .select()
      .from(listing)
      .where(and(...conditions))
      .orderBy(desc(listing.createdAt)) // newest available listings first
      .limit(PAGE_SIZE + 1)
      .offset(offset);

    const hasMore  = rows.length > PAGE_SIZE;
    const listings = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

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