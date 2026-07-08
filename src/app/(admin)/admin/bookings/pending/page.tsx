// src/app/admin/bookings/pending/page.tsx
//
// Phase 3 — Admin Pending Bookings Queue
//
// Every client who accepted the T&Cs appears here. You call them first,
// then either approve (creates real booking, notifies both sides) or
// decline (client notified with reason, no booking created).

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingRequest, listing, user } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import AdminPendingBookingsClient from "./pending-client";

// Revalidate every 60 seconds — new booking requests appear automatically
// without a manual refresh. Conservative enough to not hammer Neon at
// current volume, frequent enough to be useful while waiting for requests.
export const revalidate = 60;
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export default async function AdminPendingBookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) redirect("/home");

  const rows = await db
    .select({
      id:              bookingRequest.id,
      status:          bookingRequest.status,
      termsAcceptedAt: bookingRequest.termsAcceptedAt,
      declineReason:   bookingRequest.declineReason,
      clientId:        bookingRequest.clientId,
      clientName:      user.name,
      clientEmail:     user.email,
      clientPhone:     user.phoneNumber,
      listingId:       listing.id,
      listingTitle:    listing.title,
      listingType:     listing.type,
      listingLga:      listing.lga,
      listingState:    listing.state,
      listingLandmark: listing.landmark,
      listingPrice:    listing.price,
      listingImages:   listing.images,
      agentId:         bookingRequest.agentId,
    })
    .from(bookingRequest)
    .innerJoin(listing, eq(bookingRequest.listingId, listing.id))
    .innerJoin(user, eq(bookingRequest.clientId, user.id))
    .where(eq(bookingRequest.status, "pending"))
    .orderBy(desc(bookingRequest.termsAcceptedAt));

  // Fetch all unique agents in one query using inArray —
  // previously only fetched the first agent which broke multi-agent queues
  const agentIds = [...new Set(rows.map((r) => r.agentId))];
  const agents = agentIds.length > 0
    ? await db
        .select({ id: user.id, name: user.name, phone: user.phone, phoneNumber: user.phoneNumber })
        .from(user)
        .where(inArray(user.id, agentIds))
    : [];

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  const requests = rows.map((r) => ({
    ...r,
    clientPhone: r.clientPhone ?? null,
    agentName:   agentMap[r.agentId]?.name ?? "Unknown",
    agentPhone:  agentMap[r.agentId]?.phoneNumber ?? agentMap[r.agentId]?.phone ?? null,
  }));

  return <AdminPendingBookingsClient requests={requests} />;
}