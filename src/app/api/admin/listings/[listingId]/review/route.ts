// src/app/api/admin/listings/[listingId]/review/route.ts
//
// Phase 1 — Listing Review Gate
//
// Admin-only route handling three outcomes for a submitted listing:
//
//   approve        → listing goes live (status: "available")
//   reject         → listing removed, agent notified with reason
//   needs-correction → listing stays hidden, agent notified to wait for your call
//
// Every outcome sends an in-app notification to the agent so they always
// know where their listing stands without having to guess.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

const ADMIN_EMAIL = "corpernestng@gmail.com";

type Action = "approve" | "reject" | "needs-correction";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { listingId } = await params;

  let body: { action?: Action; reason?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { action, reason } = body;
  if (!["approve", "reject", "needs-correction"].includes(action ?? "")) {
    return NextResponse.json({ error: "action must be approve, reject, or needs-correction" }, { status: 400 });
  }

  // Fetch the listing with agent details
  const [found] = await db
    .select({
      id:      listing.id,
      title:   listing.title,
      status:  listing.status,
      agentId: listing.agentId,
    })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);

  if (!found) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (found.status !== "under-review" && found.status !== "needs-correction") {
    return NextResponse.json({ error: "Listing is not pending review" }, { status: 409 });
  }

  // ── APPROVE ───────────────────────────────────────────────────────────────
  if (action === "approve") {
    await db
      .update(listing)
      .set({ status: "available", isActive: true, updatedAt: new Date() })
      .where(eq(listing.id, listingId));

    await createNotification({
      userId:  found.agentId,
      type:    "listing-approved",
      title:   "Listing approved ✓",
      message: `Your listing "${found.title}" has been approved and is now live on CorperNest.`,
      link:    "/agent",
    });

    // Confirm to admin for their own record
    sendAdminEmail(
      `Listing Approved — ${found.title}`,
      `<p style="font-family:sans-serif">You approved <strong>${found.title}</strong>. It is now live.</p>`
    ).catch(() => {});

    return NextResponse.json({ success: true, action: "approved" });
  }

  // ── REJECT ────────────────────────────────────────────────────────────────
  if (action === "reject") {
    // Soft-delete: mark inactive so it doesn't show anywhere but data is preserved
    await db
      .update(listing)
      .set({ status: "flagged", isActive: false, updatedAt: new Date() })
      .where(eq(listing.id, listingId));

    const rejectionReason = reason?.trim() || "Did not meet our listing requirements.";

    await createNotification({
      userId:  found.agentId,
      type:    "listing-rejected",
      title:   "Listing not approved",
      message: `Your listing "${found.title}" was not approved. Reason: ${rejectionReason}. Please submit a new listing with the corrections.`,
      link:    "/agent",
    });

    return NextResponse.json({ success: true, action: "rejected" });
  }

  // ── NEEDS CORRECTION ──────────────────────────────────────────────────────
  if (action === "needs-correction") {
    await db
      .update(listing)
      .set({ status: "needs-correction" as string, updatedAt: new Date() })
      .where(eq(listing.id, listingId));

    await createNotification({
      userId:  found.agentId,
      type:    "listing-needs-correction",
      title:   "Our team will call you",
      message: `Our team reviewed your listing "${found.title}" and found some corrections needed. We will call you to go through them before it goes live. Please wait for our call.`,
      link:    "/agent",
    });

    return NextResponse.json({ success: true, action: "needs-correction" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}