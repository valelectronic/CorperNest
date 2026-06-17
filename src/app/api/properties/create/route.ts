import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing, user } from "@/db/schema";
import { and, eq, ilike, notInArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { sendAdminEmail } from "@/lib/send-admin-email";
import { createNotification } from "@/lib/create-notification";
import { generateListingSlug } from "@/lib/generate-slug"; // ← NEW

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom Flat",
  "2-bed":     "2 Bedroom Flat",
  "3-bed":     "3 Bedroom Flat",
  "room":      "Single Room",
};

const VALID_TYPES     = Object.keys(TYPE_LABELS);
const VALID_PURPOSES  = ["rent", "sale"];
const VALID_AMENITIES = [
  "running-water", "prepaid-meter", "band-a-light", "band-b-light",
  "tiled-floors", "ceiling-fan", "furnished", "kitchen",
  "bathroom-inside", "security-gate", "parking-space",
  "fence-compound", "good-road-access", "close-to-nysc", "good-network",
];
const VALID_AGENCY_FEE = [5, 8, 10, 12, 15];

// Generate a unique slug, retrying with a new random suffix if collision occurs
async function generateUniqueSlug(type: string, lga: string, state: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateListingSlug(type, lga, state);
    const existing = await db
      .select({ id: listing.id })
      .from(listing)
      .where(eq(listing.slug, slug))
      .limit(1);
    if (existing.length === 0) return slug;
  }
  // Extremely unlikely fallback — append timestamp
  return `${generateListingSlug(type, lga, state)}-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "agent")
    return NextResponse.json({ error: "Only agents can create listings" }, { status: 403 });

  // 2. Parse body
  let body: {
    description?:      string;
    address?:          string;
    landmark?:         string;
    lga?:              string;
    state?:            string;
    price?:            number;
    type?:             string;
    listingPurpose?:   string;
    landlordName?:     string;
    landlordPhone?:    string;
    images?:           string[];
    amenities?:        string[];
    customAmenities?:  string[];
    agencyFeePercent?: number | null;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const {
    description, address, landmark, lga, state, price,
    type, listingPurpose = "rent",
    landlordName, landlordPhone,
    images, amenities = [], customAmenities = [],
    agencyFeePercent = null,
  } = body;

  // 3. Validate required fields
  if (!description || !address || !lga || !state || !type)
    return NextResponse.json({ error: "description, address, lga, state and type are required" }, { status: 400 });

  if (!landmark || landmark.trim().length < 5)
    return NextResponse.json({ error: "Please enter the nearest landmark" }, { status: 400 });

  if (price === undefined || price === null || typeof price !== "number" || price <= 0)
    return NextResponse.json({ error: "price must be a positive number" }, { status: 400 });

  if (!images || !Array.isArray(images) || images.length < 2)
    return NextResponse.json({ error: "At least 2 images are required" }, { status: 400 });

  if (!VALID_TYPES.includes(type))
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });

  if (!VALID_PURPOSES.includes(listingPurpose))
    return NextResponse.json({ error: "listingPurpose must be 'rent' or 'sale'" }, { status: 400 });

  if (agencyFeePercent !== null && agencyFeePercent !== undefined) {
    if (!VALID_AGENCY_FEE.includes(agencyFeePercent))
      return NextResponse.json({ error: `agencyFeePercent must be one of: ${VALID_AGENCY_FEE.join(", ")}` }, { status: 400 });
  }

  // 4. Auto-generate title
  const title = `${TYPE_LABELS[type]} in ${lga.trim()}`;

  // 5. Generate unique slug ← NEW
  const slug = await generateUniqueSlug(type, lga.trim(), state.trim());

  // 6. Sanitise amenities
  const sanitisedAmenities = amenities.filter(
    (a) => typeof a === "string" && VALID_AMENITIES.includes(a)
  );
  const sanitisedCustom = customAmenities
    .filter((a) => typeof a === "string" && a.trim().length > 0)
    .map((a) => a.trim())
    .slice(0, 10);

  // 7. Check for possible duplicates (soft — never blocks submission)
  let possibleDuplicate = false;
  try {
    const dupes = await db
      .select({ id: listing.id })
      .from(listing)
      .where(
        and(
          eq(listing.lga,    lga.trim()),
          eq(listing.type,   type),
          eq(listing.isActive, true),
          notInArray(listing.status, ["flagged"]),
          ilike(listing.landmark, `%${landmark.trim().slice(0, 20)}%`),
        )
      )
      .limit(1);
    possibleDuplicate = dupes.length > 0;
  } catch {
    // Silent — never block submission due to duplicate check failure
  }

  // 8. Insert
  try {
    const listingId = nanoid();
    const now       = new Date();

    await db.insert(listing).values({
      id:                  listingId,
      agentId:             session.user.id,
      title,
      slug,                                // ← NEW
      description:         description.trim(),
      address:             address.trim(),
      landmark:            landmark.trim(),
      lga:                 lga.trim(),
      state:               state.trim(),
      price:               Math.round(price),
      listingPurpose,
      type:                type as "self-con" | "mini-flat" | "1-bed" | "2-bed" | "3-bed" | "room",
      status:              "under-review",
      landlordName:        landlordName?.trim()  ?? null,
      landlordPhone:       landlordPhone?.trim() ?? null,
      landlordOtpVerified: false,
      agencyFeePercent:    agencyFeePercent ?? null,
      images,
      amenities:           sanitisedAmenities,
      customAmenities:     sanitisedCustom,
      isActive:            true,
      lastStatusUpdate:    now,
      createdAt:           now,
      updatedAt:           now,
    });

    // 9. Notify agent in-app
    await createNotification({
      userId:  session.user.id,
      type:    "listing-under-review",
      title:   "Listing submitted ✓",
      message: `Your ${title} is under review. We'll notify you once it's approved — usually within 24 hours.`,
      link:    "/agent",
    });

    // 10. Fetch agent for admin email
    const agentRows = await db
      .select({ name: user.name, email: user.email, phone: user.phone })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    const agent = agentRows[0];

    // 11. Email admin — include duplicate warning if detected
    sendAdminEmail(
      `New Listing for Review${possibleDuplicate ? " ⚠️ Possible Duplicate" : ""} — ${title}`,
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#1B2E1B;margin:0 0 4px">New Listing Submitted</h2>
          <p style="color:#7A9A7A;margin:0 0 24px;font-size:13px">Requires your review before going live</p>

          ${possibleDuplicate ? `
          <div style="background:#FFF8E1;border:1px solid #FAC775;border-radius:10px;padding:12px 16px;margin-bottom:20px">
            <p style="margin:0;font-size:13px;font-weight:700;color:#92400E">
              ⚠️ Possible duplicate detected
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:#B45309">
              Another active listing exists with a similar landmark and property type in ${lga.trim()}. 
              Please verify this is a different unit before approving.
            </p>
          </div>
          ` : ""}

          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A;width:140px">Listing</td>
                <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;font-weight:600;color:#1B1B1B">${title}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Landmark</td>
                <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">${landmark.trim()}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Address</td>
                <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">${address.trim()}, ${lga.trim()}, ${state.trim()}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Purpose</td>
                <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B;text-transform:capitalize">${listingPurpose}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Price</td>
                <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">₦${Math.round(price).toLocaleString()}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Agency Fee</td>
                <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">${agencyFeePercent ? `${agencyFeePercent}%` : "Not set"}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Agent</td>
                <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">${agent?.name ?? "Unknown"}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Agent Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">${agent?.email ?? "—"}</td></tr>
            <tr><td style="padding:10px 0;color:#7A9A7A">Agent Phone</td>
                <td style="padding:10px 0;color:#1B1B1B">${agent?.phone ?? "—"}</td></tr>
          </table>

          <a href="https://www.corpernest.com.ng/admin/listings"
             style="display:inline-block;margin-top:24px;padding:12px 24px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
            Review in Admin Dashboard →
          </a>
          <p style="margin-top:24px;font-size:12px;color:#7A9A7A">
            Submitted ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT
          </p>
        </div>
      `
    ).catch((err) => console.error("[create listing] admin email failed:", err));

    return NextResponse.json({ success: true, listingId, slug, possibleDuplicate }, { status: 201 });
  } catch (error) {
    console.error("[properties/create] DB error:", error);
    return NextResponse.json({ error: "Failed to create listing. Please try again." }, { status: 500 });
  }
}