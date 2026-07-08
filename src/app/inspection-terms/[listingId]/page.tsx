// src/app/inspection-terms/[listingId]/page.tsx
//
// Phase 2A — Client Inspection T&Cs
//
// This page sits between "Book Free Inspection" and actual booking creation.
// The client reads the terms and accepts. Nothing gets created yet — you
// (admin) receive a notification email with the client's details and the
// property they want to inspect, call them personally to explain everything,
// then approve the booking manually from your admin dashboard.
//
// Why this exists:
// - Most Nigerians don't read T&Cs, so you call every client anyway
// - The accept click gives you a timestamped record that they agreed
// - It also confirms the client is serious — people who aren't ready
//   to tap "Accept" aren't ready to visit a property either

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import InspectionTermsClient from "./inspection-client";

export const dynamic = "force-dynamic";

export default async function InspectionTermsPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  const { listingId } = await params;

  const [found] = await db
    .select({
      id:        listing.id,
      title:     listing.title,
      type:      listing.type,
      lga:       listing.lga,
      state:     listing.state,
      landmark:  listing.landmark,
      price:     listing.price,
      status:    listing.status,
      agentId:   listing.agentId,
      agentName: user.name,
    })
    .from(listing)
    .innerJoin(user, eq(listing.agentId, user.id))
    .where(eq(listing.id, listingId))
    .limit(1);

  if (!found || found.status !== "available") redirect("/home");

  return (
    <InspectionTermsClient
      listing={found}
      clientName={session.user.name}
    />
  );
}