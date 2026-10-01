// src/app/api/parkout/listings/feed/route.ts
// Public masked feed for Park-Out listings.
// Returns ONLY active listings.
// NEVER exposes: exactAddress, landlordName, landlordPhone,
// outgoingUserId, bank details, caretaker details.
// Orders by moveOutDate ascending — most urgent first.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq, and, gt, asc } from "drizzle-orm";

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const state = searchParams.get("state") ?? "";
  const lga = searchParams.get("lga") ?? "";
  const roomType = searchParams.get("roomType") ?? "";

  try {
    // ── Build conditions ─────────────────────────────────────────────────────
    const conditions = [
      eq(parkoutListing.status, "active"),
      gt(parkoutListing.moveOutDate, new Date()),
    ];

    if (state) {
      conditions.push(eq(parkoutListing.state, state));
    }

    if (lga) {
      conditions.push(eq(parkoutListing.lga, lga));
    }

    if (roomType) {
      conditions.push(eq(parkoutListing.roomType, roomType));
    }

    // ── Fetch public listing fields only ─────────────────────────────────────
    const rows = await db
      .select({
        id: parkoutListing.id,
        title: parkoutListing.title,
        roomType: parkoutListing.roomType,
        state: parkoutListing.state,
        lga: parkoutListing.lga,
        neighbourhood: parkoutListing.neighbourhood,
        annualRent: parkoutListing.annualRent,
        facilitationFee: parkoutListing.facilitationFee,
        moveOutDate: parkoutListing.moveOutDate,
        images: parkoutListing.images,
        description: parkoutListing.description,
        landlordRules: parkoutListing.landlordRules,
        hasLandlordAgent: parkoutListing.hasLandlordAgent,
        hasFurnitureForSale: parkoutListing.hasFurnitureForSale,
      })
      .from(parkoutListing)
      .where(and(...conditions))
      .orderBy(asc(parkoutListing.moveOutDate))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE);

    // ── Pagination ───────────────────────────────────────────────────────────
    const hasMore = rows.length > PAGE_SIZE;
    const listings = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return NextResponse.json({
      listings,
      hasMore,
      page,
    });
  } catch (err) {
    console.error("[parkout/feed]", err);

    return NextResponse.json(
      { error: "Failed to fetch listings." },
      { status: 500 }
    );
  }
}