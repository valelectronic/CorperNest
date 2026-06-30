// src/app/api/property-requests/matches/[matchId]/review/route.ts
//
// Admin-only. Approves or rejects a pending agent-initiated match.
// Approve  → fires the renter's notification, request status → "matched"
// Reject   → notifies the agent with the reason, renter never sees it,
//            does NOT count against the request's 3-match cap

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyRequest, requestMatch, listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { matchId } = await params;

  let body: { action?: "approve" | "reject"; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, reason } = body;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const matchRow = await db
    .select({
      id:        requestMatch.id,
      requestId: requestMatch.requestId,
      listingId: requestMatch.listingId,
      status:    requestMatch.status,
      matchedBy: requestMatch.matchedBy,
    })
    .from(requestMatch)
    .where(eq(requestMatch.id, matchId))
    .limit(1);

  if (matchRow.length === 0) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (matchRow[0].status !== "pending") {
    return NextResponse.json({ error: "This match has already been reviewed" }, { status: 409 });
  }

  const requestRow = await db
    .select({ renterId: propertyRequest.renterId })
    .from(propertyRequest)
    .where(eq(propertyRequest.id, matchRow[0].requestId))
    .limit(1);

  if (action === "approve") {
    await db
      .update(requestMatch)
      .set({ status: "approved", reviewedAt: new Date(), reviewedBy: session.user.id })
      .where(eq(requestMatch.id, matchId));

    await db
      .update(propertyRequest)
      .set({ status: "matched" })
      .where(eq(propertyRequest.id, matchRow[0].requestId));

    if (requestRow.length > 0) {
      await createNotification({
        userId: requestRow[0].renterId,
        type: "request-matched",
        title: "Property found!",
        message: "We found a property matching your request — tap to view.",
        link: `/properties/${matchRow[0].listingId}`,
      });
    }
  } else {
    await db
      .update(requestMatch)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        rejectionReason: reason?.trim() || null,
      })
      .where(eq(requestMatch.id, matchId));

    // Notify the agent so they understand why and can try again with
    // something that actually fits, rather than wondering what happened
    await createNotification({
      userId: matchRow[0].matchedBy,
      type: "match-rejected",
      title: "Match declined",
      message: reason?.trim()
        ? `Your match was declined: ${reason.trim()}`
        : "Your match for a property request was declined. Check the renter's stated budget and landmark before matching again.",
      link: "/agent",
    });
  }

  return NextResponse.json({ success: true });
}