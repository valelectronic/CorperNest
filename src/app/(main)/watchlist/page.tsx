// src/app/(main)/watchlist/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { watchlist, listing } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import WatchlistClient from "./watchlist-client";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  const rows = await db
    .select({
      id:              listing.id,
      title:           listing.title,
      description:     listing.description,
      lga:             listing.lga,
      state:           listing.state,
      price:           listing.price,
      type:            listing.type,
      status:          listing.status,
      listingPurpose:  listing.listingPurpose,
      images:          listing.images,
      amenities:       listing.amenities,
      customAmenities: listing.customAmenities,
      createdAt:       listing.createdAt,
    })
    .from(watchlist)
    .innerJoin(listing, eq(watchlist.listingId, listing.id))
    .where(eq(watchlist.renterId, session.user.id))
    .orderBy(desc(watchlist.createdAt));

  return <WatchlistClient listings={rows} />;
}