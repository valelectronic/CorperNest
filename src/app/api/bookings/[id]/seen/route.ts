// src/app/api/bookings/[id]/seen/route.ts
//
// Phase 5 — "I Have Seen The Agent" confirmation
//
// Called when a client confirms they physically visited the agent.
// This is the core trust mechanism of the new free inspection model:
//   - Updates booking status to "verified"
//   - Notifies admin immediately (you need to know a visit happened)
//   - Updates agent dashboard to show "Client confirmed visit"
//
// No commission logic here — that's triggered manually by admin
// from their dashboard after seeing this notification.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, listing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookingId } = await params;

  const [found] = await db
    .select({
      id:        booking.id,
      status:    booking.status,
      renterId:  booking.renterId,
      agentId:   booking.agentId,
      listingId: booking.listingId,
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!found) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only the renter who owns this booking can confirm it
  if (found.renterId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Prevent double confirmation
  if (found.status === "verified" || found.status === "completed") {
    return NextResponse.json({ error: "Visit already confirmed" }, { status: 409 });
  }

  // Must be an active booking
  if (found.status === "cancelled") {
    return NextResponse.json({ error: "This booking is cancelled" }, { status: 409 });
  }

  // Mark as verified
  await db
    .update(booking)
    .set({ status: "verified", updatedAt: new Date() })
    .where(eq(booking.id, bookingId));

  // Fetch names and listing for notifications
  const [listingRow, clientRow, agentRow] = await Promise.all([
    db.select({ title: listing.title, lga: listing.lga })
      .from(listing).where(eq(listing.id, found.listingId)).limit(1),
    db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
      .from(user).where(eq(user.id, found.renterId)).limit(1),
    db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
      .from(user).where(eq(user.id, found.agentId)).limit(1),
  ]);

  const listingTitle = listingRow[0]?.title ?? "Unknown property";
  const clientName   = clientRow[0]?.name   ?? "Unknown client";
  const agentName    = agentRow[0]?.name    ?? "Unknown agent";
  const clientPhone  = clientRow[0]?.phoneNumber ?? clientRow[0]?.phone ?? "Not provided";
  const agentPhone   = agentRow[0]?.phoneNumber  ?? agentRow[0]?.phone  ?? "Not provided";

  // Notify agent — positive framing, no mention of commission yet
  await createNotification({
    userId:  found.agentId,
    type:    "visit-confirmed",
    title:   "Client confirmed their visit ✓",
    message: `${clientName} confirmed they visited ${listingTitle}. Great work!`,
    link:    "/agent",
  });

  // Notify admin — awaited so Vercel doesn't kill before email sends
  try {
    await sendAdminEmail(
    `✅ Visit Confirmed — ${clientName} saw ${agentName}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1B2E1B;margin:0 0 4px">Visit Confirmed</h2>
        <p style="color:#2E7D32;font-weight:600;margin:0 0 20px">
          A client has confirmed they physically visited the agent.
          Send the commission request when ready.
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A;width:140px">Client</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;font-weight:600">${clientName}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Client Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">
                <a href="tel:${clientPhone}" style="color:#2E7D32;font-weight:700">${clientPhone}</a>
              </td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Agent</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;font-weight:600">${agentName}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Agent Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">
                <a href="tel:${agentPhone}" style="color:#2E7D32;font-weight:700">${agentPhone}</a>
              </td></tr>
          <tr><td style="padding:10px 0;color:#7A9A7A">Property</td>
              <td style="padding:10px 0">${listingTitle}, ${listingRow[0]?.lga ?? ""}</td></tr>
        </table>

        <a href="https://www.corpernest.com.ng/admin/bookings"
           style="display:inline-block;padding:12px 24px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
          View in Admin Bookings →
        </a>
      </div>
    `
  ).catch((err) => console.error("[seen] Admin email failed:", err));
  } catch (err) {
    console.error("[seen] Admin email failed:", err);
  }

  return NextResponse.json({ success: true });
}