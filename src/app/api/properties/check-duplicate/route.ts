import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { and, eq, ilike, notInArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const landmark = searchParams.get("landmark")?.trim() ?? "";
  const lga      = searchParams.get("lga")?.trim() ?? "";
  const type     = searchParams.get("type")?.trim() ?? "";

  if (!landmark || landmark.length < 5 || !lga || !type) {
    return NextResponse.json({ duplicate: false });
  }

  // Check for similar listings — same LGA + type + landmark (fuzzy match)
  // Exclude flagged/under-review from current agent so they don't flag their own pending listings
  const HIDDEN = ["flagged"];

  const matches = await db
    .select({
      id:       listing.id,
      title:    listing.title,
      landmark: listing.landmark,
      lga:      listing.lga,
      type:     listing.type,
      status:   listing.status,
    })
    .from(listing)
    .where(
      and(
        eq(listing.lga,    lga),
        eq(listing.type,   type),
        eq(listing.isActive, true),
        notInArray(listing.status, HIDDEN),
        ilike(listing.landmark, `%${landmark.slice(0, 20)}%`),
      )
    )
    .limit(3);

  if (matches.length === 0) {
    return NextResponse.json({ duplicate: false });
  }

  return NextResponse.json({
    duplicate: true,
    count:     matches.length,
    examples:  matches.map((m) => ({ title: m.title, landmark: m.landmark, status: m.status })),
  });
}