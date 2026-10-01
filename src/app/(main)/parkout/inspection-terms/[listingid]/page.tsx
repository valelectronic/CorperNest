// src/app/(main)/parkout/inspection-terms/[listingId]/page.tsx
// Server component — fetches listing details and passes to client.
// Shown when incoming tenant taps "Book Inspection" on listing detail.
// They read the terms here before proceeding to payment.

import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parkoutListing } from "@/db/schema";
import { eq } from "drizzle-orm";
import InspectionClient from "./inspection-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ listingId: string }> };

export default async function InspectionTermsPage({ params }: Props) {
  const { listingId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/signin?redirect=/parkout/inspection-terms/${listingId}`);
  }

  const [listing] = await db
    .select({
      id:               parkoutListing.id,
      outgoingUserId:   parkoutListing.outgoingUserId,
      title:            parkoutListing.title,
      roomType:         parkoutListing.roomType,
      lga:              parkoutListing.lga,
      state:            parkoutListing.state,
      neighbourhood:    parkoutListing.neighbourhood,
      annualRent:       parkoutListing.annualRent,
      facilitationFee:  parkoutListing.facilitationFee,
      moveOutDate:      parkoutListing.moveOutDate,
      images:           parkoutListing.images,
      ambassadorId:     parkoutListing.ambassadorId,
      status:           parkoutListing.status,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.id, listingId))
    .limit(1);

  // Listing must exist and be active
  if (!listing) notFound();
  if (listing.status !== "active") {
    redirect(`/parkout/listing/${listingId}`);
  }

  // Owner cannot book their own listing
  if (listing.outgoingUserId === session.user.id) {
    redirect(`/parkout/listing/${listingId}`);
  }

  return (
    <InspectionClient
      listing={listing}
      userName={session.user.name ?? ""}
    />
  );
}