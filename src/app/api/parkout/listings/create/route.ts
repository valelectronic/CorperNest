// src/app/api/parkout/listings/create/route.ts
// Creates a new Park-Out listing.
// Changes: transportEstimates saved, landlordAware removed,
// landlordRules now validated as required.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutListing, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

const ROOM_LABEL: Record<string, string> = {
  "self-con":  "Self-contained",
  "mini-flat": "Mini flat",
  "room":      "Single room",
  "1-bed":     "1 bedroom flat",
  "2-bed":     "2 bedroom flat",
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body = await req.json();
  const {
    roomType, annualRent, moveOutDate,
    state, lga, neighbourhood,
    hasLandlordAgent, landlordConsent,
    occupancyProofUrl, images,
    description, landlordRules, itemsAvailable,
    transportEstimates,
    cautionFee, agreementFee, extraFees,
    exactAddress, caretakerName, caretakerPhone,
  } = body;

  // ── Validate required fields ─────────────────────────────────────────
  if (!roomType)                    return NextResponse.json({ error: "Room type is required."              }, { status: 400 });
  if (!annualRent || isNaN(Number(annualRent)) || Number(annualRent) < 10000)
                                    return NextResponse.json({ error: "Valid annual rent is required."     }, { status: 400 });
  if (!moveOutDate)                 return NextResponse.json({ error: "Move-out date is required."         }, { status: 400 });
  if (!state)                       return NextResponse.json({ error: "State is required."                 }, { status: 400 });
  if (!lga)                         return NextResponse.json({ error: "LGA is required."                   }, { status: 400 });
  if (!neighbourhood?.trim())       return NextResponse.json({ error: "Neighbourhood is required."         }, { status: 400 });
  if (!occupancyProofUrl)           return NextResponse.json({ error: "Proof of occupancy is required."   }, { status: 400 });
  if (!images || images.length < 3) return NextResponse.json({ error: "At least 3 room photos required."  }, { status: 400 });
  if (!landlordRules?.trim() || landlordRules.trim().length < 20)
                                    return NextResponse.json({ error: "Landlord rules required (min 20 chars)." }, { status: 400 });
  if (!exactAddress?.trim())        return NextResponse.json({ error: "Exact address is required."        }, { status: 400 });
  if (!caretakerName?.trim())       return NextResponse.json({ error: "Caretaker name is required."       }, { status: 400 });
  if (!caretakerPhone?.trim())      return NextResponse.json({ error: "Caretaker phone is required."      }, { status: 400 });

  // ── Validate transport estimates ─────────────────────────────────────
  const validTransport = (transportEstimates ?? []).filter(
    (l: { name: string; bikeCost: string; kekeCost: string }) =>
      l.name?.trim() && l.bikeCost && l.kekeCost
  );
  if (validTransport.length < 2) {
    return NextResponse.json({ error: "Add at least 2 transport landmarks." }, { status: 400 });
  }


  // ── Calculate property facilitation fee (kobo) ───────────────────────
  const rentKobo        = Math.round(Number(annualRent) * 100);
  const facilitationFee = Math.round(rentKobo * 0.10);

  // ── Normalise transport estimates ────────────────────────────────────
  const normalised = validTransport.map((l: { name: string; bikeCost: string; kekeCost: string }) => ({
    name:     l.name.trim(),
    bikeCost: Number(l.bikeCost),
    kekeCost: Number(l.kekeCost),
  }));

  // ── Create listing ───────────────────────────────────────────────────
  const listingId = `po_${nanoid(12)}`;
  const title     = `${ROOM_LABEL[roomType] ?? roomType} in ${neighbourhood}`;

  await db.insert(parkoutListing).values({
    id:             listingId,
    outgoingUserId: session.user.id,
    ambassadorId:   null,
    title,
    roomType,
    state,
    lga,
    neighbourhood,
    annualRent:     rentKobo,
    facilitationFee,
    moveOutDate:    new Date(moveOutDate),
    description:    description?.trim() || null,
    landlordRules:  landlordRules.trim(),
    hasFurnitureForSale: Boolean(itemsAvailable?.trim()),
    itemsAvailable: itemsAvailable?.trim() || null,
    images:         images ?? [],
    occupancyProofUrl,
    hasLandlordAgent:         Boolean(hasLandlordAgent),
    landlordConsentConfirmed: Boolean(landlordConsent),
    exactAddress:   exactAddress.trim(),
    landlordName:   caretakerName.trim(),
    landlordPhone:  caretakerPhone.trim(),
    transportEstimates: normalised,
    moveInFees: {
      cautionFee:   Number(cautionFee)   || 0,
      agreementFee: Number(agreementFee) || 0,
      extraFees:    (extraFees ?? [])
        .filter((f: { name: string; amount: string }) => f.name?.trim() && f.amount)
        .map((f: { name: string; amount: string }) => ({
          name:   f.name.trim(),
          amount: Number(f.amount) || 0,
        })),
    },
    status:    "pending_approval",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ── Notify admin ─────────────────────────────────────────────────────
  const [adminUser] = await db.select({ id: user.id }).from(user)
    .where(eq(user.email, process.env.ADMIN_EMAIL ?? "corpernestng@gmail.com")).limit(1);

  if (adminUser) {
    await createNotification({
      userId:  adminUser.id,
      type:    "parkout-new-listing",
      title:   `🏠 New Park-Out listing — ${lga}`,
      message: `${session.user.name ?? "A user"} listed a ${roomType} near ${neighbourhood}. Annual rent: ₦${Number(annualRent).toLocaleString("en-NG")}.`,
      link:    `/admin/parkout/listings/${listingId}`,
    }).catch(() => {});
  }

  // ── Email admin ──────────────────────────────────────────────────────
  await sendAdminEmail(
    `🏠 New Park-Out Listing — ${lga}, ${state}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#15803D;margin:0 0 4px">New Park-Out Listing</h2>
      <p style="color:#6B7280;margin:0 0 20px;font-size:13px">Review and assign a Location Ambassador</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
        <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280;width:160px">Listed by</td>
            <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:600">${session.user.name ?? "—"}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Room type</td>
            <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${ROOM_LABEL[roomType] ?? roomType}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Location</td>
            <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:600;color:#15803D">${neighbourhood}, ${lga}, ${state}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Annual rent</td>
            <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;font-weight:700">₦${Number(annualRent).toLocaleString("en-NG")}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Move-out</td>
            <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${new Date(moveOutDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E5E7EB;color:#6B7280">Caretaker</td>
            <td style="padding:10px 0;border-bottom:1px solid #E5E7EB">${caretakerName} — ${caretakerPhone}</td></tr>
        <tr><td style="padding:10px 0;color:#6B7280">Proof</td>
            <td style="padding:10px 0"><a href="${occupancyProofUrl}" target="_blank" style="color:#15803D">View document →</a></td></tr>
      </table>
      <a href="https://www.corpernest.com.ng/admin/parkout/listings/${listingId}"
         style="display:inline-block;padding:12px 24px;background:#15803D;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
        Review in Admin Panel →
      </a>
    </div>`
  ).catch(() => {});

  // ── Notify outgoing tenant ───────────────────────────────────────────
  await createNotification({
    userId:  session.user.id,
    type:    "parkout-listing-submitted",
    title:   "Listing submitted! 🏠",
    message: `Your ${roomType} in ${neighbourhood} has been submitted. We will review and notify you within 24 hours.`,
    link:    "/parkout",
  }).catch(() => {});

  return NextResponse.json({ success: true, listingId });
}