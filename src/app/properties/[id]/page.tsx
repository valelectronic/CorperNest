import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing, user, watchlist } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PropertyDetailClient from "./property-detail-client";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.corpernest.com.ng";

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom Flat",
  "2-bed":     "2 Bedroom Flat",
  "room":      "Single Room",
};

type Props = {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
};

// ─── DYNAMIC METADATA ────────────────────────────────────────────────────────
// Each property page gets its own title, description and OG image
// This is what shows when someone shares a listing on WhatsApp
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const [found] = await db
    .select({
      id:             listing.id,
      title:          listing.title,
      description:    listing.description,
      address:        listing.address,
      lga:            listing.lga,
      state:          listing.state,
      price:          listing.price,
      type:           listing.type,
      listingPurpose: listing.listingPurpose,
      images:         listing.images,
      status:         listing.status,
    })
    .from(listing)
    .where(and(eq(listing.id, id), eq(listing.isActive, true)))
    .limit(1);

  if (!found) return { title: "Property Not Found" };

  const typeLabel   = TYPE_LABELS[found.type] ?? found.type;
  const price       = `₦${found.price.toLocaleString("en-NG")}`;
  const purpose     = found.listingPurpose === "sale" ? "for sale" : "for rent";
  const location    = `${found.lga}, ${found.state}`;
  const coverImage  = found.images?.[0] ?? "/og-image.png";

  const title       = `${typeLabel} in ${found.lga} — ${price}${found.listingPurpose === "rent" ? "/yr" : ""}`;
  const description = `Verified ${typeLabel.toLowerCase()} ${purpose} in ${location}. ${price}${found.listingPurpose === "rent" ? " per year" : ""}. ${found.description.slice(0, 120)}. Book an inspection on CorperNest — no scams.`;
  const url         = `${BASE_URL}/properties/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type:        "website",
      url,
      siteName:    "CorperNest",
      title:       `${title} | CorperNest`,
      description,
      locale:      "en_NG",
      images: [
        {
          url:    coverImage,
          width:  1200,
          height: 630,
          alt:    title,
        },
      ],
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${title} | CorperNest`,
      description,
      images:      [coverImage],
    },
  };
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default async function PropertyDetailPage({ params, searchParams }: Props) {
  const { id }     = await params;
  const { action } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });

  const [found] = await db
    .select()
    .from(listing)
    .where(and(eq(listing.id, id), eq(listing.isActive, true)))
    .limit(1);

  if (!found) notFound();

  const [agent] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.id, found.agentId))
    .limit(1);

  let isWatchlisted = false;
  if (session) {
    const [wl] = await db
      .select({ id: watchlist.id })
      .from(watchlist)
      .where(and(eq(watchlist.renterId, session.user.id), eq(watchlist.listingId, id)))
      .limit(1);
    isWatchlisted = !!wl;
  }

  // ── JSON-LD Structured Data ──────────────────────────────────────────────
  // This tells Google exactly what this page is — a real estate listing
  // Enables rich results in search (price, location, availability shown directly)
  const typeLabel  = TYPE_LABELS[found.type] ?? found.type;
  const jsonLd = {
    "@context":         "https://schema.org",
    "@type":            "RealEstateListing",
    "name":             found.title,
    "description":      found.description,
    "url":              `${BASE_URL}/properties/${found.id}`,
    "image":            found.images ?? [],
    "datePosted":       new Date(found.createdAt).toISOString(),
    "offers": {
      "@type":          "Offer",
      "price":          found.price,
      "priceCurrency":  "NGN",
      "availability":   found.status === "available"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    "address": {
      "@type":           "PostalAddress",
      "addressLocality": found.lga,
      "addressRegion":   found.state,
      "addressCountry":  "NG",
    },
    "provider": {
      "@type": "Organization",
      "name":  "CorperNest",
      "url":   BASE_URL,
    },
  };

  return (
    <>
      {/* Inject JSON-LD into page head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailClient
        listing={found}
        agentName={agent?.name ?? "Agent"}
        isLoggedIn={!!session}
        isWatchlisted={isWatchlisted}
        autoOpenBooking={action === "book"}
      />
    </>
  );
}