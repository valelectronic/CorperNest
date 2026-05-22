import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listing } from "@/db/schema";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

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
    title?: string;
    description?: string;
    address?: string;
    lga?: string;
    state?: string;
    price?: number;
    type?: string;
    landlordName?: string;
    landlordPhone?: string;
    images?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    title,
    description,
    address,
    lga,
    state,
    price,
    type,
    landlordName,
    landlordPhone,
    images,
  } = body;

  // 4. Validate required fields
  if (!title || !description || !address || !lga || !state || !type) {
    return NextResponse.json(
      { error: "title, description, address, lga, state, and type are required" },
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

  const validTypes = ["self-con", "mini-flat", "1-bed", "2-bed", "room"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // 5. Insert listing
  try {
    const listingId = nanoid();
    const now = new Date();

    await db.insert(listing).values({
      id: listingId,
      agentId: session.user.id,
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      lga: lga.trim(),
      state: state.trim(),
      price: Math.round(price), // integer naira
      type: type as "self-con" | "mini-flat" | "1-bed" | "2-bed" | "room",
      status: "under-review",
      landlordName: landlordName?.trim() ?? null,
      landlordPhone: landlordPhone?.trim() ?? null,
      landlordOtpVerified: false,
      images,
      isActive: true,
      lastStatusUpdate: now,
      createdAt: now,
      updatedAt: now,
    });

    // 6. Return success
    return NextResponse.json({ success: true, listingId }, { status: 201 });
  } catch (error) {
    console.error("[properties/create] DB error:", error);
    return NextResponse.json(
      { error: "Failed to create listing. Please try again." },
      { status: 500 }
    );
  }
}