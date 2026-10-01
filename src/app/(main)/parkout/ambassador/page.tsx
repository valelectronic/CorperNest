// src/app/(main)/parkout/ambassador/page.tsx

// Ambassador portal — server component.

// Auth check + ambassador record check.

// If not an ambassador → redirect to apply page.

import { redirect } from "next/navigation";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { db } from "@/lib/db";

import { parkoutAmbassador, parkoutListing, user } from "@/db/schema";

import { eq, and } from "drizzle-orm";

import AmbassadorPortalClient from "./portal-client";

export const dynamic = "force-dynamic";

export default async function AmbassadorPortalPage() {

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  // Check if user is an ambassador

  const [ambassador] = await db
    .select({
      id:          parkoutAmbassador.id,
      lga:         parkoutAmbassador.lga,
      state:       parkoutAmbassador.state,
      isActive:    parkoutAmbassador.isActive,
      totalDeals:  parkoutAmbassador.totalDeals,
      totalEarned: parkoutAmbassador.totalEarned,
      status:      parkoutAmbassador.status,
    })
    .from(parkoutAmbassador)
    .where(eq(parkoutAmbassador.userId, session.user.id))
    .limit(1);

  // Not an ambassador → redirect to apply

  if (!ambassador) redirect("/parkout/ambassador/apply");

  // Fetch assigned active listings with all private details

  const assignedListings = await db
    .select({
      id:                    parkoutListing.id,
      title:                 parkoutListing.title,
      roomType:              parkoutListing.roomType,
      state:                 parkoutListing.state,
      lga:                   parkoutListing.lga,
      neighbourhood:         parkoutListing.neighbourhood,
      annualRent:            parkoutListing.annualRent,
      facilitationFee:       parkoutListing.facilitationFee,
      moveOutDate:           parkoutListing.moveOutDate,
      images:                parkoutListing.images,
      description:            parkoutListing.description,
      landlordRules:          parkoutListing.landlordRules,
      exactAddress:           parkoutListing.exactAddress,
      landlordName:           parkoutListing.landlordName,
      landlordPhone:          parkoutListing.landlordPhone,
      outgoingUserId:         parkoutListing.outgoingUserId,
      transportEstimates:     parkoutListing.transportEstimates,
      moveInFees:             parkoutListing.moveInFees,
      verifiedByAmbassador:   parkoutListing.verifiedByAmbassador,
      verifiedAt:             parkoutListing.verifiedAt,
      status:                 parkoutListing.status,
      createdAt:              parkoutListing.createdAt,
    })
    .from(parkoutListing)
    .where(and(
      eq(parkoutListing.ambassadorId, ambassador.id),
      eq(parkoutListing.status, "active"),
    ))
    .orderBy(parkoutListing.moveOutDate);

  // Fetch outgoing tenant names + phones for each listing

  const listingsWithTenants = await Promise.all(
    assignedListings.map(async (l) => {
      const [tenant] = await db
        .select({ name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, l.outgoingUserId))
        .limit(1);
      return { ...l, tenantName: tenant?.name ?? "—", tenantEmail: tenant?.email ?? "—" };
    })
  );

  // Fetch completed deals

  const completedListings = await db
    .select({
      id:                    parkoutListing.id,
      title:                 parkoutListing.title,
      lga:                   parkoutListing.lga,
      annualRent:            parkoutListing.annualRent,
      moveOutDate:           parkoutListing.moveOutDate,
    })
    .from(parkoutListing)
    .where(and(
      eq(parkoutListing.ambassadorId, ambassador.id),
      eq(parkoutListing.status, "completed"),
    ))
    .orderBy(parkoutListing.moveOutDate);

  return (
    <AmbassadorPortalClient
      ambassador={ambassador}
      userName={session.user.name ?? "Ambassador"}
      assignedListings={listingsWithTenants}
      completedListings={completedListings}
    />
  );

}