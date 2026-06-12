import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { listingId?: string; reason?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { listingId, reason } = body;
  if (!listingId)
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  if (!reason || reason.trim().length < 5)
    return NextResponse.json({ error: "A decline reason is required" }, { status: 400 });

  const rows = await db
    .select({
      id:      listing.id,
      title:   listing.title,
      agentId: listing.agentId,
      status:  listing.status,
    })
    .from(listing)
    .innerJoin(user, eq(listing.agentId, user.id))
    .where(eq(listing.id, listingId))
    .limit(1);

  if (!rows.length)
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const row = rows[0];

  if (row.status !== "under-review")
    return NextResponse.json({ error: "Listing is not under review" }, { status: 400 });

  // Flag it — off public feed, agent can still see it in their dashboard
  await db
    .update(listing)
    .set({ status: "flagged", lastStatusUpdate: new Date(), updatedAt: new Date() })
    .where(eq(listing.id, listingId));

  // In-app notification only — no email (conserving Resend free quota)
  await createNotification({
    userId:  row.agentId,
    type:    "listing-declined",
    title:   "Listing needs changes",
    message: `Your ${row.title} was not approved. Reason: ${reason.trim()}`,
    link:    "/agent",
  });

  return NextResponse.json({ success: true });
}