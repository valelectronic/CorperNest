// src/app/api/marketplace/listings/[id]/report/route.ts
// Buyer reports a listing — saves to Neon and notifies admin via push.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceReport, marketplaceListing, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to report a listing." }, { status: 401 });
  }

  const { id }              = await params;
  const { reason, details } = await req.json();

  if (!reason) return NextResponse.json({ error: "Reason required." }, { status: 400 });

  // Check listing exists
  const [listing] = await db
    .select({ id: marketplaceListing.id, title: marketplaceListing.title, sellerId: marketplaceListing.sellerId })
    .from(marketplaceListing)
    .where(eq(marketplaceListing.id, id))
    .limit(1);

  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  // Prevent duplicate reports from same user
  const [existing] = await db
    .select({ id: marketplaceReport.id })
    .from(marketplaceReport)
    .where(and(
      eq(marketplaceReport.listingId, id),
      eq(marketplaceReport.reporterId, session.user.id),
    ))
    .limit(1);

  if (existing) return NextResponse.json({ error: "You have already reported this listing." }, { status: 400 });

  // Save report
  await db.insert(marketplaceReport).values({
    id:         nanoid(),
    listingId:  id,
    reporterId: session.user.id,
    reason:     details ? `${reason}: ${details}` : reason,
    status:     "open",
    createdAt:  new Date(),
  });

  // Notify admin
  const [adminUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL))
    .limit(1);

  if (adminUser) {
    await createNotification({
      userId:  adminUser.id,
      type:    "marketplace-listing-reported",
      title:   "Listing reported 🚨",
      message: `A user reported "${listing.title}" for: ${reason}. Review in admin listings.`,
      link:    `/admin/marketplace/listings`,
    });
  }

  return NextResponse.json({ success: true });
}