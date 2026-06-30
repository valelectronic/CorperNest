// src/app/api/property-requests/[id]/match/route.ts
//
// Manual matching — now gated by admin review for agent-initiated matches.
// When an AGENT matches: status="pending", renter sees NOTHING yet, doesn't
// count toward the 3-match cap, request status stays unchanged.
// When ADMIN matches: auto-approved immediately (you reviewing your own
// match is redundant), renter notified right away, same as before.
//
// This exists specifically to prevent a bad-faith or careless match (wrong
// budget, wrong landmark, missing amenities) from reaching a renter and
// costing them a wasted ₦5,000 inspection fee on something that was never
// actually going to fit what they asked for.

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

  const requestRow = await db
    .select({
      id:        propertyRequest.id,
      renterId:  propertyRequest.renterId,
      status:    propertyRequest.status,
      minBudget: propertyRequest.minBudget,
      maxBudget: propertyRequest.maxBudget,
    })
    .from(propertyRequest)
    .where(eq(propertyRequest.id, requestId))
    .limit(1);

  if (requestRow.length === 0) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (["booked", "closed-by-renter", "expired"].includes(requestRow[0].status)) {
    return NextResponse.json({ error: "This request is no longer open" }, { status: 409 });
  }

  // Cap counts APPROVED matches only — a rejected or still-pending match
  // should never eat into the renter's 3 real match slots.
  const approvedMatchCount = await db
    .select({ count: count() })
    .from(requestMatch)
    .where(and(eq(requestMatch.requestId, requestId), eq(requestMatch.status, "approved")));

  if (approvedMatchCount[0].count >= 3) {
    return NextResponse.json({ error: "This request already has the maximum of 3 matches" }, { status: 409 });
  }

  const listingRow = await db
    .select({ id: listing.id, status: listing.status, isActive: listing.isActive, price: listing.price, title: listing.title })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);

  if (listingRow.length === 0 || !listingRow[0].isActive || listingRow[0].status !== "available") {
    return NextResponse.json({ error: "Listing must be approved and available to match" }, { status: 400 });
  }

  const alreadyMatched = await db
    .select({ id: requestMatch.id })
    .from(requestMatch)
    .where(and(
      eq(requestMatch.requestId, requestId),
      eq(requestMatch.listingId, listingId),
      // A previously rejected match against the same listing can be
      // resubmitted (e.g. price was renegotiated) — only block duplicates
      // that are still pending or already approved.
      eq(requestMatch.status, "pending"),
    ))
    .limit(1);

  if (alreadyMatched.length > 0) {
    return NextResponse.json({ error: "This listing is already pending review for this request" }, { status: 409 });
  }

  // ── Admin matches are auto-approved; agent matches go to review queue ──
  const initialStatus = isAdmin ? "approved" : "pending";

  const matchId = nanoid();
  await db.insert(requestMatch).values({
    id: matchId,
    requestId,
    listingId,
    note: note?.trim() ?? null,
    matchedBy: session.user.id,
    status: initialStatus,
    reviewedAt: isAdmin ? new Date() : null,
    reviewedBy: isAdmin ? session.user.id : null,
    createdAt: new Date(),
  });

  if (initialStatus === "approved") {
    await db.update(propertyRequest).set({ status: "matched" }).where(eq(propertyRequest.id, requestId));

    await createNotification({
      userId: requestRow[0].renterId,
      type: "request-matched",
      title: "Property found!",
      message: note?.trim()
        ? `We found a property for your request. Note: ${note.trim()}`
        : "We found a property matching your request — tap to view.",
      link: `/properties/${listingId}`,
    });
  } else {
    // ── Pending — admin needs to review before this reaches the renter ──
    const budgetFit = requestRow[0].minBudget && requestRow[0].maxBudget
      ? (listingRow[0].price >= requestRow[0].minBudget && listingRow[0].price <= requestRow[0].maxBudget
          ? "✓ Within stated budget"
          : `⚠ Outside stated budget (₦${requestRow[0].minBudget.toLocaleString()} - ₦${requestRow[0].maxBudget.toLocaleString()})`)
      : "Budget not specified by renter";

    const [agentRow, renterRow] = await Promise.all([
      db.select({ name: user.name, email: user.email, phoneNumber: user.phoneNumber, phone: user.phone })
        .from(user).where(eq(user.id, session.user.id)).limit(1),
      db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
        .from(user).where(eq(user.id, requestRow[0].renterId)).limit(1),
    ]);

    const agentPhone  = agentRow[0]?.phoneNumber ?? agentRow[0]?.phone ?? "Not provided";
    const renterPhone = renterRow[0]?.phoneNumber ?? renterRow[0]?.phone ?? "Not provided";

    sendAdminEmail(
      `Match Pending Review — ${listingRow[0].title}`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#1B2E1B;margin:0 0 4px">An agent matched a property request</h2>
          <p style="color:#92400E;font-weight:600">This is NOT visible to the renter yet — review and approve or reject.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
            <tr><td style="padding:8px 0;color:#7A9A7A;width:140px">Agent</td><td style="padding:8px 0">${agentRow[0]?.name ?? "Unknown"} (${agentRow[0]?.email ?? "—"})</td></tr>
            <tr><td style="padding:8px 0;color:#7A9A7A">Agent Phone</td><td style="padding:8px 0">${agentPhone}</td></tr>
            <tr><td style="padding:8px 0;color:#7A9A7A">Renter Phone</td><td style="padding:8px 0">${renterPhone}</td></tr>
            <tr><td style="padding:8px 0;color:#7A9A7A">Listing</td><td style="padding:8px 0">${listingRow[0].title} (₦${listingRow[0].price.toLocaleString()}/yr)</td></tr>
            <tr><td style="padding:8px 0;color:#7A9A7A">Budget Fit</td><td style="padding:8px 0"><b>${budgetFit}</b></td></tr>
            <tr><td style="padding:8px 0;color:#7A9A7A">Note from agent</td><td style="padding:8px 0">${note?.trim() || "—"}</td></tr>
          </table>
          <a href="https://www.corpernest.com.ng/admin/property-requests" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-size:13px">Review in Admin →</a>
        </div>
      `
    ).catch((err) => console.error("[property-request] Pending-match admin email failed:", err));
  }

  return NextResponse.json({ success: true, status: initialStatus });
}