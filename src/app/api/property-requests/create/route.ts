// src/app/api/property-requests/create/route.ts
//
// Creates a renter's property request. Always goes straight to "open" —
// matching happens manually via [id]/match/route.ts, by admin or a
// verified agent, whenever something is actually found. Auto-matching
// against existing inventory was removed deliberately: at only 3 listings
// total, an automatic search would almost always come back empty, adding
// real complexity for a case that rarely fires. Worth revisiting once
// there's enough inventory for it to actually find something most of
// the time.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyRequest, user } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { sendAdminEmail } from "@/lib/send-admin-email";

const VALID_TYPES = ["self-con", "mini-flat", "1-bed", "2-bed", "3-bed", "room"];

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Enforce 1 active request per renter ─────────────────────────────────
  const existingActive = await db
    .select({ id: propertyRequest.id })
    .from(propertyRequest)
    .where(
      and(
        eq(propertyRequest.renterId, session.user.id),
        or(eq(propertyRequest.status, "open"), eq(propertyRequest.status, "matched")),
      )
    )
    .limit(1);

  if (existingActive.length > 0) {
    return NextResponse.json(
      { error: "You already have an active request. Close it before submitting a new one." },
      { status: 409 }
    );
  }

  let body: { lga?: string; state?: string; type?: string; purpose?: string; landmark?: string; minBudget?: number; maxBudget?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { lga, state, type, purpose, landmark, minBudget, maxBudget, notes } = body;

  if (!lga || !state || !type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "LGA, state, and a valid property type are required" }, { status: 400 });
  }

  if (purpose && !["rent", "sale"].includes(purpose)) {
    return NextResponse.json({ error: "Purpose must be 'rent' or 'sale'" }, { status: 400 });
  }

  const requestId = nanoid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(propertyRequest).values({
    id: requestId,
    renterId: session.user.id,
    lga: lga.trim(),
    state: state.trim(),
    type,
    listingPurpose: purpose ?? "rent",
    landmark: landmark?.trim() ?? null,
    minBudget: minBudget ?? null,
    maxBudget: maxBudget ?? null,
    notes: notes?.trim() ?? null,
    status: "open",
    createdAt: now,
    expiresAt,
  });

  // Admin always gets emailed — this is the actual core of the workflow:
  // you (or an agent) go hunt for it and link a match by hand when found.
  const renterRow = await db
    .select({ name: user.name, email: user.email, phoneNumber: user.phoneNumber, phone: user.phone })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const renterPhone = renterRow[0]?.phoneNumber ?? renterRow[0]?.phone ?? "Not provided";

  sendAdminEmail(
    `New Property Request — ${lga.trim()}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1B2E1B;margin:0 0 4px">New property request</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
          <tr><td style="padding:8px 0;color:#7A9A7A;width:140px">Renter</td><td style="padding:8px 0">${renterRow[0]?.name ?? "Unknown"}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Renter Phone</td><td style="padding:8px 0">${renterPhone}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Renter Email</td><td style="padding:8px 0">${renterRow[0]?.email ?? "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">LGA</td><td style="padding:8px 0">${lga.trim()}, ${state.trim()}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Type</td><td style="padding:8px 0">${type}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Landmark</td><td style="padding:8px 0">${landmark?.trim() || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Budget</td><td style="padding:8px 0">₦${minBudget?.toLocaleString() ?? "?"} - ₦${maxBudget?.toLocaleString() ?? "?"}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Notes</td><td style="padding:8px 0">${notes?.trim() || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#7A9A7A">Expires</td><td style="padding:8px 0">${expiresAt.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}</td></tr>
        </table>
        <p style="margin-top:16px;color:#92400E"><i>Go hunting — share in agent groups if nothing comes to mind right away.</i></p>
        <a href="https://www.corpernest.com.ng/admin/property-requests" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-size:13px">View in Admin →</a>
      </div>
    `
  ).catch((err) => console.error("[property-request] Admin email failed:", err));

  return NextResponse.json({ success: true, requestId });
}