// src/app/(main)/parkout/listing/[id]/page.tsx
// Park-Out listing detail — server component.
// Checks if current user is the owner to hide commission breakdown.
// Passes isOwner flag to client.

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Metadata } from "next";
import ListingClient from "./listting-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [row] = await db
    .select({ title: parkoutListing.title, neighbourhood: parkoutListing.neighbourhood })
    .from(parkoutListing)
    .where(eq(parkoutListing.id, id))
    .limit(1);

  return {
    title: row ? `${row.title} | CorperNest Park-Out` : "Listing | CorperNest Park-Out",
    description: row ? `Room available near ${row.neighbourhood}` : undefined,
  };
}

export default async function ParkOutListingPage({ params }: Props) {
  const { id }     = await params;
  const session    = await auth.api.getSession({ headers: await headers() });
  const userId     = session?.user?.id ?? null;

  const [row] = await db
    .select({
      id:                  parkoutListing.id,
      outgoingUserId:      parkoutListing.outgoingUserId, // to check ownership
      title:               parkoutListing.title,
      roomType:            parkoutListing.roomType,
      state:               parkoutListing.state,
      lga:                 parkoutListing.lga,
      neighbourhood:       parkoutListing.neighbourhood,
      annualRent:          parkoutListing.annualRent,
      facilitationFee:     parkoutListing.facilitationFee,
      moveOutDate:         parkoutListing.moveOutDate,
      images:              parkoutListing.images,
      description:         parkoutListing.description,
      landlordRules:       parkoutListing.landlordRules,
      itemsAvailable: parkoutListing.itemsAvailable,
      hasLandlordAgent:    parkoutListing.hasLandlordAgent,
      hasFurnitureForSale: parkoutListing.hasFurnitureForSale,
      status:              parkoutListing.status,
      transportEstimates:  parkoutListing.transportEstimates,
      moveInFees: parkoutListing.moveInFees,
    })
    .from(parkoutListing)
    .where(
  and(
    eq(parkoutListing.id, id),
    inArray(parkoutListing.status, ["active", "booking_locked"]),
  )
)
    .limit(1);

  if (!row) notFound();

  // Owner should not see their own commission breakdown
  const isOwner = userId === row.outgoingUserId;

  return (
    <ListingClient
      listing={row}
      isOwner={isOwner}
    />
  );
}