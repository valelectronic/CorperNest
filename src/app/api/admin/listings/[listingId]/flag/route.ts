// src/app/api/admin/listings/[id]/flag/route.ts
// Admin-only — flags an ACTIVE listing (hides it from feed).
// Separate from the review route which only handles under-review listings.
// Sets isActive: false and status: "flagged" so it disappears from the feed.
// Agent is notified to contact admin.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)                     return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Admin only."   }, { status: 403 });

  const { listingId } = await params;

  const [found] = await db
    .select({ id: listing.id, title: listing.title, agentId: listing.agentId })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);

  if (!found) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  await db
    .update(listing)
    .set({ status: "flagged", isActive: false, updatedAt: new Date() })
    .where(eq(listing.id, listingId));

  // Notify agent
  await createNotification({
    userId:  found.agentId,
    type:    "listing-flagged",
    title:   "Your listing has been hidden",
    message: `Your listing "${found.title}" has been temporarily hidden by admin. Please contact us for details.`,
    link:    "/agent",
  });

  return NextResponse.json({ success: true });
}