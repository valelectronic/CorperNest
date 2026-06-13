import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const BASE_URL = "https://www.corpernest.com.ng";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/properties`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/signin`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/signup`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const listings = await db
      .select({ id: listing.id, updatedAt: listing.updatedAt })
      .from(listing)
      .where(and(eq(listing.status, "available"), eq(listing.isActive, true)));

    listingPages = listings.map((l) => ({
      url:             `${BASE_URL}/properties/${l.id}`,
      lastModified:    new Date(l.updatedAt),
      changeFrequency: "daily" as const,
      priority:        0.8,
    }));
  } catch (err) {
    console.error("[sitemap] listings error:", err);
  }

  let agentPages: MetadataRoute.Sitemap = [];
  try {
    const agents = await db
      .select({ id: user.id, updatedAt: user.updatedAt })
      .from(user)
      .where(eq(user.agentVerified, true));

    agentPages = agents.map((a) => ({
      url:             `${BASE_URL}/agent/${a.id}`,
      lastModified:    new Date(a.updatedAt),
      changeFrequency: "weekly" as const,
      priority:        0.6,
    }));
  } catch (err) {
    console.error("[sitemap] agents error:", err);
  }

  return [...staticPages, ...listingPages, ...agentPages];
}