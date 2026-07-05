// src/app/api/admin/listings/[listingId]/edit/route.ts
//
// Admin-only. Edits any field on a listing before approving it.
// Used when an agent submitted something with mistakes — wrong price,
// blurry description, wrong location — admin fixes it directly rather
// than sending it back and waiting for the agent to resubmit.
//
// Does NOT change the listing status — that's a separate approve/decline
// action. This just updates the data.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "corpernestng@gmail.com";

const VALID_TYPES = ["self-con", "mini-flat", "1-bed", "2-bed", "3-bed", "room"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { listingId } = await params;

  let body: {
    title?:           string;
    price?:           number;
    landmark?:        string;
    address?:         string;
    lga?:             string;
    state?:           string;
    type?:            string;
    listingPurpose?:  string;
    description?:     string;
    amenities?:       string[];
    customAmenities?: string[];
    images?:          string[];
    agencyFeePercent?: number | null;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  // Validate what was provided
  if (body.price !== undefined && (isNaN(body.price) || body.price <= 0)) {
    return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
  }
  if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid property type" }, { status: 400 });
  }
  if (body.images !== undefined && body.images.length < 2) {
    return NextResponse.json({ error: "At least 2 photos required" }, { status: 400 });
  }

  const [found] = await db
    .select({ id: listing.id, status: listing.status })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);

  if (!found) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Build the update object with only provided fields
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title           !== undefined) updates.title           = body.title.trim();
  if (body.price           !== undefined) updates.price           = body.price;
  if (body.landmark        !== undefined) updates.landmark        = body.landmark.trim();
  if (body.address         !== undefined) updates.address         = body.address.trim();
  if (body.lga             !== undefined) updates.lga             = body.lga.trim();
  if (body.state           !== undefined) updates.state           = body.state.trim();
  if (body.type            !== undefined) updates.type            = body.type;
  if (body.listingPurpose  !== undefined) updates.listingPurpose  = body.listingPurpose;
  if (body.description     !== undefined) updates.description     = body.description.trim();
  if (body.amenities       !== undefined) updates.amenities       = body.amenities;
  if (body.customAmenities !== undefined) updates.customAmenities = body.customAmenities;
  if (body.images          !== undefined) updates.images          = body.images;
  if (body.agencyFeePercent !== undefined) updates.agencyFeePercent = body.agencyFeePercent;

  await db.update(listing).set(updates).where(eq(listing.id, listingId));

  return NextResponse.json({ success: true });
}