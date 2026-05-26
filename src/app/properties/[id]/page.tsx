import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, user, watchlist } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PropertyDetailClient from "./property-detail-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
};

export default async function PropertyDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { action } = await searchParams;

  // Check session — no redirect, just pass isLoggedIn to client
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Fetch listing — must be active
  const [found] = await db
    .select()
    .from(listing)
    .where(and(eq(listing.id, id), eq(listing.isActive, true)))
    .limit(1);

  if (!found) notFound();

  // Fetch agent's public info — name only, phone hidden until both-confirmed
  const [agent] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.id, found.agentId))
    .limit(1);

  // Check if logged-in corper has watchlisted this listing
  let isWatchlisted = false;
  if (session) {
    const [wl] = await db
      .select({ id: watchlist.id })
      .from(watchlist)
      .where(
        and(
          eq(watchlist.renterId, session.user.id),
          eq(watchlist.listingId, id),
        )
      )
      .limit(1);
    isWatchlisted = !!wl;
  }

  return (
    <PropertyDetailClient
      listing={found}
      agentName={agent?.name ?? "Agent"}
      isLoggedIn={!!session}
      isWatchlisted={isWatchlisted}
      autoOpenBooking={action === "book"}
    />
  );
}