// src/app/(main)/parkout/my-listing/page.tsx
// Shows the logged-in user's own Park-Out listing(s).
// Handles all states: none, pending, active, completed, rejected.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import MyListingClient from "./my-listing-client";

export const dynamic = "force-dynamic";

export default async function MyListingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin?redirect=/parkout/my-listing");

  const listings = await db
    .select({
      id:                   parkoutListing.id,
      title:                parkoutListing.title,
      roomType:             parkoutListing.roomType,
      lga:                  parkoutListing.lga,
      state:                parkoutListing.state,
      neighbourhood:        parkoutListing.neighbourhood,
      annualRent:           parkoutListing.annualRent,
      facilitationFee:      parkoutListing.facilitationFee,
      moveOutDate:          parkoutListing.moveOutDate,
      images:               parkoutListing.images,
      status:               parkoutListing.status,
      verifiedByAmbassador: parkoutListing.verifiedByAmbassador,
      createdAt:            parkoutListing.createdAt,
      approvedAt:           parkoutListing.approvedAt,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.outgoingUserId, session.user.id))
    .orderBy(desc(parkoutListing.createdAt));

  return (
    <MyListingClient
      listings={listings}
      userName={session.user.name ?? ""}
    />
  );
}