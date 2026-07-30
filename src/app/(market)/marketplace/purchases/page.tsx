// src/app/(market)/marketplace/purchases/page.tsx
// Buyer tracks their escrow transactions here.
// Shows all purchases with status and the "Item Received" button.
// Tapping "Item Received" marks the transaction complete and
// triggers admin to release payment to seller.

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceTransaction, marketplaceListing, marketplaceAvailabilityRequest } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import PurchasesClient from "./purchases-client";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin?redirect=/marketplace/purchases");

  // Fetch pending availability requests — buyer tracking reservations
  const pendingRequests = await db
    .select({
      id:                 marketplaceAvailabilityRequest.id,
      listingId:          marketplaceAvailabilityRequest.listingId,
      agreedPrice:        marketplaceAvailabilityRequest.agreedPrice,
      status:             marketplaceAvailabilityRequest.status,
      expiresAt:          marketplaceAvailabilityRequest.expiresAt,
      checkoutExpiresAt:  marketplaceAvailabilityRequest.checkoutExpiresAt,
      createdAt:          marketplaceAvailabilityRequest.createdAt,
      listingTitle:       marketplaceListing.title,
      listingImages:      marketplaceListing.images,
      listingStatus:      marketplaceListing.status,
    })
    .from(marketplaceAvailabilityRequest)
    .innerJoin(marketplaceListing, eq(marketplaceAvailabilityRequest.listingId, marketplaceListing.id))
    .where(and(
      eq(marketplaceAvailabilityRequest.buyerId, session.user.id),
      inArray(marketplaceAvailabilityRequest.status, ["pending", "confirmed"]),
    ))
    .orderBy(desc(marketplaceAvailabilityRequest.createdAt))
    .catch(() => []);

  const rows = await db
    .select({
      id:           marketplaceTransaction.id,
      listingId:    marketplaceTransaction.listingId,
      amount:       marketplaceTransaction.amount,
      commission:   marketplaceTransaction.commission,
      sellerPayout: marketplaceTransaction.sellerPayout,
      status:       marketplaceTransaction.status,
      paystackRef:  marketplaceTransaction.paystackRef,
      paidAt:       marketplaceTransaction.paidAt,
      confirmedAt:  marketplaceTransaction.confirmedAt,
      releasedAt:   marketplaceTransaction.releasedAt,
      createdAt:    marketplaceTransaction.createdAt,
      // Listing details
      listingTitle:   marketplaceListing.title,
      listingImages:  marketplaceListing.images,
      listingStatus:  marketplaceListing.status,
      listingLga:     marketplaceListing.lga,
      listingState:   marketplaceListing.state,
      listingLandmark: marketplaceListing.landmark,
    })
    .from(marketplaceTransaction)
    .innerJoin(marketplaceListing, eq(marketplaceTransaction.listingId, marketplaceListing.id))
    .where(eq(marketplaceTransaction.buyerId, session.user.id))
    .orderBy(desc(marketplaceTransaction.createdAt))
    .catch(() => []);

  const purchases = rows.map((r) => ({
    ...r,
    amount:       r.amount       / 100,
    commission:   r.commission   / 100,
    sellerPayout: r.sellerPayout / 100,
    listingImages: r.listingImages ?? [],
  }));

  const requests = pendingRequests.map((r) => ({
    ...r,
    agreedPrice:   r.agreedPrice / 100,
    listingImages: r.listingImages ?? [],
    expiresAtMs:       new Date(r.expiresAt).getTime(),
    checkoutExpiresAtMs: r.checkoutExpiresAt
      ? new Date(r.checkoutExpiresAt).getTime()
      : null,
  }));

  return (
    <PurchasesClient
      purchases={purchases}
      pendingRequests={requests}
    />
  );
}