import { db } from "@/lib/db";
import { user, listing, review, agentKycRequest, booking } from "@/db/schema";
import { eq, and, avg, count, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import AgentProfileClient from "./agent-profile-client";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;

  // Fetch agent
  const agentRows = await db
    .select({
      id:            user.id,
      name:          user.name,
      agentVerified: user.agentVerified,
      state:         user.state,
      createdAt:     user.createdAt,
    })
    .from(user)
    .where(and(eq(user.id, agentId), eq(user.agentVerified, true)))
    .limit(1);

  if (!agentRows.length) notFound();
  const agent = agentRows[0];

  // KYC details (lga, bank not shown publicly — just lga/state)
  const kycRows = await db
    .select({ lga: agentKycRequest.lga })
    .from(agentKycRequest)
    .where(and(eq(agentKycRequest.agentId, agentId), eq(agentKycRequest.status, "approved")))
    .limit(1);
  const lga = kycRows[0]?.lga ?? null;

  // Active listings
  const listings = await db
    .select({
      id:             listing.id,
      title:          listing.title,
      address:        listing.address,
      lga:            listing.lga,
      price:          listing.price,
      type:           listing.type,
      status:         listing.status,
      listingPurpose: listing.listingPurpose,
      images:         listing.images,
    })
    .from(listing)
    .where(and(eq(listing.agentId, agentId), eq(listing.status, "available"), eq(listing.isActive, true)))
    .orderBy(desc(listing.createdAt))
    .limit(10);

  // Review stats
  const ratingStats = await db
    .select({
      avgRating: avg(review.rating),
      total:     count(),
    })
    .from(review)
    .where(eq(review.agentId, agentId));

  const avgRating  = Number(ratingStats[0]?.avgRating ?? 0);
  const totalReviews = Number(ratingStats[0]?.total ?? 0);

  // Recent reviews (with reviewer name)
  const reviews = await db
    .select({
      id:           review.id,
      rating:       review.rating,
      comment:      review.comment,
      createdAt:    review.createdAt,
      reviewerName: user.name,
    })
    .from(review)
    .innerJoin(user, eq(review.reviewerId, user.id))
    .where(eq(review.agentId, agentId))
    .orderBy(desc(review.createdAt))
    .limit(10);

  // Completed inspections count
  const completedRows = await db
    .select({ count: count() })
    .from(booking)
    .where(and(eq(booking.agentId, agentId), eq(booking.status, "verified")));
  const completedCount = Number(completedRows[0]?.count ?? 0);

  return (
    <AgentProfileClient
      agent={{ ...agent, lga, createdAt: agent.createdAt.toISOString() }}
      listings={listings.map((l) => ({ ...l, images: l.images ?? [] }))}
      avgRating={avgRating}
      totalReviews={totalReviews}
      completedCount={completedCount}
      reviews={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
    />
  );
}