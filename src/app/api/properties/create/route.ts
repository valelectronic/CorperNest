import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

// Maps property type slug to a readable label for auto-generated title
const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom Flat",
  "2-bed":     "2 Bedroom Flat",
  "room":      "Single Room",
};

const VALID_TYPES = Object.keys(TYPE_LABELS);

const VALID_AMENITIES = [
  "running-water", "prepaid-meter", "band-a-light", "band-b-light",
  "tiled-floors", "ceiling-fan", "furnished", "kitchen",
  "bathroom-inside", "security-gate", "parking-space",
  "fence-compound", "good-road-access", "close-to-nysc", "good-network",
];

const VALID_PURPOSES = ["rent", "sale"];

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Role check
  if (session.user.role !== "agent") {
    return NextResponse.json(
      { error: "Only agents can create listings" },
      { status: 403 }
    );
  }

  // 3. Parse body
  let body: {
    description?: string;
    address?: string;
    lga?: string;
    state?: string;
    price?: number;
    type?: string;
    listingPurpose?: string;
    landlordName?: string;
    landlordPhone?: string;
    images?: string[];
    amenities?: string[];
    customAmenities?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    description,
    address,
    lga,
    state,
    price,
    type,
    listingPurpose = "rent",
    landlordName,
    landlordPhone,
    images,
    amenities = [],
    customAmenities = [],
  } = body;

  // 4. Validate required fields
  if (!description || !address || !lga || !state || !type) {
    return NextResponse.json(
      { error: "description, address, lga, state, and type are required" },
      { status: 400 }
    );
  }

  if (price === undefined || price === null || typeof price !== "number" || price <= 0) {
    return NextResponse.json(
      { error: "price must be a positive number" },
      { status: 400 }
    );
  }

  if (!images || !Array.isArray(images) || images.length < 2) {
    return NextResponse.json(
      { error: "At least 2 images are required" },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!VALID_PURPOSES.includes(listingPurpose)) {
    return NextResponse.json(
      { error: "listingPurpose must be 'rent' or 'sale'" },
      { status: 400 }
    );
  }

  // 5. Auto-generate title from type + lga
  // e.g. "Self Contained in Uyo" — agent never types this
  const title = `${TYPE_LABELS[type]} in ${lga.trim()}`;

  // 6. Sanitise amenities
  const sanitisedAmenities = amenities.filter(
    (a) => typeof a === "string" && VALID_AMENITIES.includes(a)
  );

  const sanitisedCustom = customAmenities
    .filter((a) => typeof a === "string" && a.trim().length > 0)
    .map((a) => a.trim())
    .slice(0, 10);

  // 7. Insert listing
  try {
    const listingId = nanoid();
    const now = new Date();

    await db.insert(listing).values({
      id: listingId,
      agentId: session.user.id,
      title,
      description: description.trim(),
      address: address.trim(),
      lga: lga.trim(),
      state: state.trim(),
      price: Math.round(price),
      listingPurpose,
      type: type as "self-con" | "mini-flat" | "1-bed" | "2-bed" | "room",
      status: "under-review",
      landlordName: landlordName?.trim() ?? null,
      landlordPhone: landlordPhone?.trim() ?? null,
      landlordOtpVerified: false,
      images,
      amenities: sanitisedAmenities,
      customAmenities: sanitisedCustom,
      isActive: true,
      lastStatusUpdate: now,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, listingId }, { status: 201 });
  } catch (error) {
    console.error("[properties/create] DB error:", error);
    return NextResponse.json(
      { error: "Failed to create listing. Please try again." },
      { status: 500 }
    );
  }
}