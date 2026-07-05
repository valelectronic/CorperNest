// src/app/api/admin/listings/pending/route.ts
//
// Returns all listings currently under-review or needs-correction,
// with full details and agent contact info for the admin review queue.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rows = await db
    .select({
      id:               listing.id,
      title:            listing.title,
      type:             listing.type,
      listingPurpose:   listing.listingPurpose,
      price:            listing.price,
      lga:              listing.lga,
      state:            listing.state,
      address:          listing.address,
      landmark:         listing.landmark,
      amenities:        listing.amenities,
      customAmenities:  listing.customAmenities,
      images:           listing.images,
      agencyFeePercent: listing.agencyFeePercent,
      status:           listing.status,
      createdAt:        listing.createdAt,
      agentId:          listing.agentId,
    })
    .from(listing)
    .where(inArray(listing.status, ["under-review", "needs-correction"]))
    .orderBy(desc(listing.createdAt));

  // Fetch agent details for each listing
  const agentIds = [...new Set(rows.map((r) => r.agentId))];
  const agents = agentIds.length > 0
    ? await db
        .select({ id: user.id, name: user.name, email: user.email, phone: user.phone, phoneNumber: user.phoneNumber })
        .from(user)
        .where(inArray(user.id, agentIds))
    : [];

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  const listings = rows.map((r) => {
    const agent = agentMap[r.agentId];
    return {
      ...r,
      agentName:  agent?.name  ?? "Unknown",
      agentPhone: agent?.phoneNumber ?? agent?.phone ?? null,
      agentEmail: agent?.email ?? "—",
    };
  });

  return NextResponse.json({ listings });
}