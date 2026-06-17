// ─── DEBUG VERSION — run this instead to see what's happening ───────────────

import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import { generateListingSlug } from "@/lib/generate-slug";

async function backfillSlugs() {
  console.log("Starting backfill script...");
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);

  try {
    console.log("Fetching listings without slugs...");

    const listingsWithoutSlug = await db
      .select({ id: listing.id, type: listing.type, lga: listing.lga, state: listing.state, slug: listing.slug })
      .from(listing);

    console.log("All listings:", JSON.stringify(listingsWithoutSlug, null, 2));

    const needsSlug = listingsWithoutSlug.filter((l) => !l.slug);
    console.log(`Found ${needsSlug.length} listings to backfill.`);

    for (const l of needsSlug) {
      let slug = generateListingSlug(l.type, l.lga, l.state);
      console.log(`Generated slug for ${l.id}: ${slug}`);

      let attempts = 0;
      while (attempts < 5) {
        const existing = await db
          .select({ id: listing.id })
          .from(listing)
          .where(eq(listing.slug, slug))
          .limit(1);
        if (existing.length === 0) break;
        slug = generateListingSlug(l.type, l.lga, l.state);
        attempts++;
      }

      const result = await db.update(listing).set({ slug }).where(eq(listing.id, l.id)).returning();
      console.log(`Update result for ${l.id}:`, JSON.stringify(result));
    }

    console.log("Backfill complete.");
  } catch (err) {
    console.error("ERROR during backfill:", err);
  }
}

backfillSlugs()
  .then(() => {
    console.log("Script finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });