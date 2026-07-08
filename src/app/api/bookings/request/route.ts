// src/app/api/bookings/request/route.ts
//
// Phase 2A — Free Booking Request
//
// Called when a client accepts the T&Cs. Creates a pending booking
// request (NOT an approved booking yet) and notifies admin to call
// the client. Nothing is visible to the agent yet.
//
// The booking only becomes real when admin clicks "Approve Booking"
// in their dashboard. This two-step process ensures every client has
// been spoken to before being connected to an agent.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingRequest, listing, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { sendAdminEmail } from "@/lib/send-admin-email";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { listingId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { listingId } = body;
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  // Fetch listing + agent details for the email
  const [found] = await db
    .select({
      id:        listing.id,
      title:     listing.title,
      type:      listing.type,
      lga:       listing.lga,
      state:     listing.state,
      landmark:  listing.landmark,
      price:     listing.price,
      status:    listing.status,
      agentId:   listing.agentId,
      agentName:        user.name,
      agentPhone:       user.phoneNumber,
      agentPhoneLegacy: user.phone,
    })
    .from(listing)
    .innerJoin(user, eq(listing.agentId, user.id))
    .where(eq(listing.id, listingId))
    .limit(1);

  if (!found || found.status !== "available") {
    return NextResponse.json({ error: "This listing is not available" }, { status: 409 });
  }

  // Prevent duplicate pending requests from same client on same listing
  const existing = await db
    .select({ id: bookingRequest.id })
    .from(bookingRequest)
    .where(
      and(
        eq(bookingRequest.clientId, session.user.id),
        eq(bookingRequest.listingId, listingId),
        eq(bookingRequest.status, "pending"),
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "You already have a pending request for this property" }, { status: 409 });
  }

  // Fetch client details for the email
  const [clientRow] = await db
    .select({ name: user.name, phone: user.phone, phoneNumber: user.phoneNumber, email: user.email })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const clientPhone = clientRow?.phoneNumber ?? clientRow?.phone ?? "Not provided";
  const agentPhone  = found.agentPhone ?? found.agentPhoneLegacy ?? "Not provided";
  const location    = found.landmark
    ? `${found.landmark}, ${found.lga}, ${found.state}`
    : `${found.lga}, ${found.state}`;

  // Create the pending booking request
  const requestId = nanoid();
  await db.insert(bookingRequest).values({
    id:          requestId,
    clientId:    session.user.id,
    listingId,
    agentId:     found.agentId,
    status:      "pending",
    termsAcceptedAt: new Date(),
    createdAt:   new Date(),
    updatedAt:   new Date(),
  });

  // Notify admin — await it so Vercel doesn't kill the function before email sends
  try {
    await sendAdminEmail(
    `🔔 New Inspection Request — Call Client Now`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1B2E1B;margin:0 0 4px">New Inspection Request</h2>
        <p style="color:#E53935;font-weight:700;font-size:14px;margin:0 0 24px">
          ⚡ Call this client now to explain the process and confirm their visit.
        </p>

        <div style="background:#E8F5E9;border-radius:12px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#1B5E20;text-transform:uppercase;letter-spacing:0.04em">Client to call</p>
          <p style="margin:0 0 4px;font-size:16px;font-weight:800;color:#1B2E1B;font-family:sans-serif">${clientRow?.name ?? "Unknown"}</p>
          <a href="tel:${clientPhone}" style="font-size:18px;font-weight:700;color:#2E7D32;text-decoration:none">📞 ${clientPhone}</a>
          <p style="margin:6px 0 0;font-size:12px;color:#388E3C">${clientRow?.email ?? "—"}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A;width:140px">Property</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;font-weight:600">${found.title}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Location</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">📍 ${location}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Price</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;font-weight:700;color:#2E7D32">₦${found.price.toLocaleString()}/yr</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Agent</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">${found.agentName}</td></tr>
          <tr><td style="padding:10px 0;color:#7A9A7A">Agent Phone</td>
              <td style="padding:10px 0">${agentPhone}</td></tr>
        </table>

        <p style="font-size:13px;color:#7A9A7A;margin:0 0 16px">
          Terms accepted: ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT
        </p>

        <a href="https://www.corpernest.com.ng/admin/bookings/pending"
           style="display:inline-block;padding:12px 24px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
          Approve Booking in Admin →
        </a>
      </div>
    `
  ).catch((err) => console.error("[booking/request] Admin email failed:", err));
  } catch (err) {
    console.error("[booking/request] Admin email failed:", err);
  }

  return NextResponse.json({ success: true, requestId });
}