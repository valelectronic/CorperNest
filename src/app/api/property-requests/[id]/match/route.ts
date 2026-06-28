// src/app/api/property-requests/[id]/match/route.ts
//
// Manual matching — used when an agent lists something new specifically
// because of a request (or any time admin/agent wants to hand-link an
// existing approved listing to a request, beyond the automatic 3-match cap).
// This is what makes "how will the renter know this new listing is theirs"
// concrete: confirming a match here is what fires their notification.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyRequest, requestMatch, listing, user } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin or verified agents can manually match — same gate as listing creation
  const ADMIN_EMAIL = "corpernestng@gmail.com";
  const isAdmin = session.user.email === ADMIN_EMAIL;
  const userRow = await db
    .select({ agentVerified: user.agentVerified })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  const isVerifiedAgent = userRow[0]?.agentVerified === true;

  if (!isAdmin && !isVerifiedAgent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: requestId } = await params;

  let body: { listingId?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { listingId, note } = body;
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  // Confirm the request exists and isn't already closed/booked
  const requestRow = await db
    .select({ id: propertyRequest.id, renterId: propertyRequest.renterId, status: propertyRequest.status })
    .from(propertyRequest)
    .where(eq(propertyRequest.id, requestId))
    .limit(1);

  if (requestRow.length === 0) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (["booked", "closed-by-renter", "expired"].includes(requestRow[0].status)) {
    return NextResponse.json({ error: "This request is no longer open" }, { status: 409 });
  }

  // Cap at 3 matches per request
  const existingMatchCount = await db
    .select({ count: count() })
    .from(requestMatch)
    .where(eq(requestMatch.requestId, requestId));

  if (existingMatchCount[0].count >= 3) {
    return NextResponse.json({ error: "This request already has the maximum of 3 matches" }, { status: 409 });
  }

  // Confirm the listing is real, approved, and live — only verified inventory
  // can ever be linked here, no shortcuts even for manual matching
  const listingRow = await db
    .select({ id: listing.id, status: listing.status, isActive: listing.isActive })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);

  if (listingRow.length === 0 || !listingRow[0].isActive || listingRow[0].status !== "available") {
    return NextResponse.json({ error: "Listing must be approved and available to match" }, { status: 400 });
  }

  // Prevent the same listing being matched twice to the same request —
  // wastes a match slot and would show the renter a duplicate
  const alreadyMatched = await db
    .select({ id: requestMatch.id })
    .from(requestMatch)
    .where(and(eq(requestMatch.requestId, requestId), eq(requestMatch.listingId, listingId)))
    .limit(1);

  if (alreadyMatched.length > 0) {
    return NextResponse.json({ error: "This listing is already matched to this request" }, { status: 409 });
  }

  await db.insert(requestMatch).values({
    id: nanoid(),
    requestId,
    listingId,
    note: note?.trim() ?? null,
    matchedBy: session.user.id,
    createdAt: new Date(),
  });

  await db.update(propertyRequest).set({ status: "matched" }).where(eq(propertyRequest.id, requestId));

  // Fire the renter's notification immediately — pointing at this exact listing
  await createNotification({
    userId: requestRow[0].renterId,
    type: "request-matched",
    title: "Property found!",
    message: note?.trim()
      ? `We found a property for your request. Note: ${note.trim()}`
      : "We found a property matching your request — tap to view.",
    link: `/properties/${listingId}`,
  });

  // ── Email admin only if an AGENT made this match, not admin themselves ──
  // If you matched it yourself, you already know — no need to email you.
  // If an agent matched it without you, this is exactly when you need to
  // know, so you can make your verification call.
  if (!isAdmin) {
    const agentRow = await db
      .select({ name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    sendAdminEmail(
      `Agent Matched a Request — ${requestRow[0].id}`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#1B2E1B;margin:0 0 4px">Agent matched a property request</h2>
          <p style="color:#3B6D11"><i>Call the agent to verify before the renter visits.</i></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
            <tr><td style="padding:8px 0;color:#7A9A7A;width:140px">Agent</td><td style="padding:8px 0">${agentRow[0]?.name ?? "Unknown"} (${agentRow[0]?.email ?? "—"})</td></tr>
            <tr><td style="padding:8px 0;color:#7A9A7A">Listing ID</td><td style="padding:8px 0">${listingId}</td></tr>
            <tr><td style="padding:8px 0;color:#7A9A7A">Note from agent</td><td style="padding:8px 0">${note?.trim() || "—"}</td></tr>
          </table>
          <a href="https://www.corpernest.com.ng/admin/property-requests" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-size:13px">View in Admin →</a>
        </div>
      `
    ).catch((err) => console.error("[property-request] Agent-match admin email failed:", err));
  }

  return NextResponse.json({ success: true });
}