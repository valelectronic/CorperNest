// src/app/(market)/marketplace/[id]/page.tsx
// Listing detail page — what buyers see when they tap a listing
// Server component fetches data, client handles interactivity
// Open Graph meta tags for clean WhatsApp share previews

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { marketplaceListing, user, marketplaceTransaction, marketplaceAvailabilityRequest, marketplaceOffer } from "@/db/schema";
import { eq, and, count, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ListingClient from "./listing-client";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const [row] = await db
      .select({ title: marketplaceListing.title, description: marketplaceListing.description, price: marketplaceListing.price, condition: marketplaceListing.condition, lga: marketplaceListing.lga, state: marketplaceListing.state, images: marketplaceListing.images })
      .from(marketplaceListing)
      .where(eq(marketplaceListing.id, id))
      .limit(1);

    if (!row) return { title: "Listing not found | CorperNest" };

    const priceStr   = `₦${(row.price / 100).toLocaleString("en-NG")}`;
    const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://corpernest.com.ng"}/api/marketplace/og/${id}`;

    return {
      title: `${row.title} — ${priceStr} | CorperNest Marketplace`,
      description: `${priceStr} · ${row.condition} · ${row.lga}, ${row.state}. ${row.description.slice(0, 100)}`,
      openGraph: {
        title: `${row.title} — ${priceStr}`,
        description: `${row.condition} · ${row.lga}, ${row.state} · Buy via Escrow on CorperNest`,
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${row.title} — ${priceStr}`,
        description: `${row.condition} · ${row.lga}, ${row.state}`,
        images: [ogImageUrl],
      },
    };
  } catch {
    // Neon cold start timeout — return fallback metadata, page still loads normally
    return {
      title: "Marketplace | CorperNest",
      description: "Buy and sell safely via escrow on CorperNest.",
    };
  }
}

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const sessionUser = session?.user as { phoneNumber?: string | null; phoneNumberVerified?: boolean } | undefined;
  const hasVerifiedPhone = !!(sessionUser?.phoneNumber || sessionUser?.phoneNumberVerified);

  // Fetch listing + seller info
  const [row] = await db
    .select({
      id:               marketplaceListing.id,
      listingType:      marketplaceListing.listingType,
      title:            marketplaceListing.title,
      category:         marketplaceListing.category,
      condition:        marketplaceListing.condition,
      description:      marketplaceListing.description,
      bundleItems:      marketplaceListing.bundleItems,
      price:            marketplaceListing.price,
      state:            marketplaceListing.state,
      lga:              marketplaceListing.lga,
      landmark:         marketplaceListing.landmark,
      images:           marketplaceListing.images,
      hasReceipt:       marketplaceListing.hasReceipt,
      sellerPriceNote:  marketplaceListing.sellerPriceNote,
      refPriceMin:      marketplaceListing.refPriceMin,
      refPriceMax:      marketplaceListing.refPriceMax,
      refPriceSource:   marketplaceListing.refPriceSource,
      refPriceContext:  marketplaceListing.refPriceContext,
      refPriceGoogleUrl: marketplaceListing.refPriceGoogleUrl,
      status:           marketplaceListing.status,
      createdAt:        marketplaceListing.createdAt,
      sellerId:         marketplaceListing.sellerId,
      sellerName:       user.name,
      sellerVerified:   user.marketSellerVerified,
    })
    .from(marketplaceListing)
    .innerJoin(user, eq(marketplaceListing.sellerId, user.id))
    .where(eq(marketplaceListing.id, id))
    .limit(1);

  if (!row) notFound();

  // If listing is reserving, check if availability request has expired
  // This fires lazy expiry so the listing reverts to active without needing a cron
  if (row.status === "reserving") {
    const [avReq] = await db
      .select({ id: marketplaceAvailabilityRequest.id, expiresAt: marketplaceAvailabilityRequest.expiresAt, buyerId: marketplaceAvailabilityRequest.buyerId })
      .from(marketplaceAvailabilityRequest)
      .where(and(
        eq(marketplaceAvailabilityRequest.listingId, row.id),
        eq(marketplaceAvailabilityRequest.status, "pending"),
      ))
      .limit(1);

    if (avReq && new Date(avReq.expiresAt) < new Date()) {
      // Expired — revert listing to active
      await db.update(marketplaceAvailabilityRequest)
        .set({ status: "expired" })
        .where(eq(marketplaceAvailabilityRequest.id, avReq.id));
      await db.update(marketplaceListing)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(marketplaceListing.id, row.id));
      row.status = "active";
    }
  }

  // Only show active/reserving/reserved listings to non-sellers
  // Admin can view any listing regardless of status
  const isOwnListing = session?.user?.id === row.sellerId;
  const isAdmin      = session?.user?.email === process.env.ADMIN_EMAIL || session?.user?.email === "corpernestng@gmail.com";
  if (!["active", "reserving", "reserved", "pending"].includes(row.status) && !isOwnListing && !isAdmin) {
    notFound();
  }

  // Get seller's completed sales count
  const [{ value: completedSales }] = await db
    .select({ value: count() })
    .from(marketplaceTransaction)
    .where(
      and(
        eq(marketplaceTransaction.sellerId, row.sellerId),
        eq(marketplaceTransaction.status, "released")
      )
    );

  // Get similar listings (same category, active, not this one)
  const similar = await db
    .select({
      id:       marketplaceListing.id,
      title:    marketplaceListing.title,
      price:    marketplaceListing.price,
      images:   marketplaceListing.images,
      condition: marketplaceListing.condition,
      lga:      marketplaceListing.lga,
    })
    .from(marketplaceListing)
    .where(
      and(
        eq(marketplaceListing.category, row.category),
        eq(marketplaceListing.status, "active"),
      )
    )
    .limit(10);

  const similarFiltered = similar.filter((l) => l.id !== row.id).slice(0, 6);

  // Pre-fetch active offer for this listing if user is logged in
  // Eliminates a client-side round trip and makes modal instant
  let initialOffer = null;
  if (session?.user?.id) {
    const [existingOffer] = await db
      .select()
      .from(marketplaceOffer)
      .where(and(
        eq(marketplaceOffer.listingId, row.id),
        inArray(marketplaceOffer.status, ["pending", "countered"]),
      ))
      .limit(1)
      .catch(() => []);

    if (existingOffer) {
      const isBuyer  = existingOffer.buyerId  === session.user.id;
      const isSeller = existingOffer.sellerId === session.user.id;
      if (isBuyer || isSeller) {
        initialOffer = {
          ...existingOffer,
          listedPrice:  existingOffer.listedPrice  / 100,
          latestAmount: existingOffer.latestAmount / 100,
          // Convert history amounts from kobo to naira
          history: (JSON.parse(existingOffer.history as string) as { amount: number; fromRole: string; createdAt: string }[])
            .map((h) => ({ ...h, amount: h.amount / 100 })),
        };
      }
    }
  }

  return (
    <ListingClient
      listing={{
        ...row,
        price:         row.price / 100,
        refPriceMin:   row.refPriceMin  ? row.refPriceMin  / 100 : null,
        refPriceMax:   row.refPriceMax  ? row.refPriceMax  / 100 : null,
        images:        row.images        ?? [],
        bundleItems:   row.bundleItems   ?? [],
      }}
      seller={{
        id:             row.sellerId,
        name:           row.sellerName ?? "Seller",
        verified:       row.sellerVerified ?? false,
        completedSales,
      }}
      similar={similarFiltered.map((l) => ({ ...l, price: l.price / 100, images: l.images ?? [] }))}
      currentUserId={session?.user?.id ?? null}
      isOwnListing={isOwnListing}
      hasVerifiedPhone={hasVerifiedPhone}
      initialOffer={initialOffer}
    />
  );
}