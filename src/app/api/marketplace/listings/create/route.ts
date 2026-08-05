// src/app/api/marketplace/listings/create/route.ts
// Creates a new marketplace listing — single item or bundle
// Enforces 5 active listing limit per seller (pending + active count)
// Status starts as "pending" — admin must approve before it goes live
// expiresAt set at creation: 21 days from now (reset by admin on approval)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { marketplaceListing, user } from "@/db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { sendAdminEmail } from "@/lib/send-admin-email";

const MAX_ACTIVE_LISTINGS = 5;
const EXPIRY_DAYS         = 21;

function generateId() {
  return `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    listingType = "single",
    title, category, condition, description,
    bundleItems = [],
    price, state, lga, landmark,
    images, hasReceipt = false, delivery = "pickup",
    accountNumber, bankCode, accountName,
    sellerPriceNote = null,
    // Price intelligence from seller's AI check — stored once, shown to buyers
    refPriceMin     = null,
    refPriceMax     = null,
    refPriceSource  = null,
    refPriceContext = null,
    refPriceGoogleUrl = null,
    bulkMinQty        = null,
    bulkPrice         = null,
  } = body;

  // ── Enforce 5-listing limit ────────────────────────────────────────────────
  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(marketplaceListing)
    .where(
      and(
        eq(marketplaceListing.sellerId, session.user.id),
        inArray(marketplaceListing.status, ["pending", "active", "reserved"])
      )
    );

  if (activeCount >= MAX_ACTIVE_LISTINGS) {
    return NextResponse.json({
      error: `You already have ${activeCount} active listing${activeCount > 1 ? "s" : ""}. Delete or wait for one to sell before adding another.`,
    }, { status: 400 });
  }

  // Validation
  if (!["single", "bundle"].includes(listingType)) {
    return NextResponse.json({ error: "Invalid listing type." }, { status: 400 });
  }
  if (!title?.trim())       return NextResponse.json({ error: "Title is required." },         { status: 400 });
  if (!category)            return NextResponse.json({ error: "Category is required." },      { status: 400 });
  if (!condition)           return NextResponse.json({ error: "Condition is required." },     { status: 400 });
  if (!description?.trim()) return NextResponse.json({ error: "Description is required." },  { status: 400 });
  if (!price || price <= 0) return NextResponse.json({ error: "Valid price is required." },  { status: 400 });
  if (!state)               return NextResponse.json({ error: "State is required." },         { status: 400 });
  if (!lga)                 return NextResponse.json({ error: "LGA is required." },           { status: 400 });
  if (!landmark?.trim())    return NextResponse.json({ error: "Landmark is required." },      { status: 400 });
  if (!images?.length)      return NextResponse.json({ error: "At least 1 photo required." },{ status: 400 });
  if (!accountNumber || !bankCode || !accountName) {
    return NextResponse.json({ error: "Bank account verification is required." }, { status: 400 });
  }
  if (listingType === "bundle") {
    const cleanBundle = bundleItems.filter((s: string) => s?.trim());
    if (cleanBundle.length < 2) {
      return NextResponse.json({ error: "Add at least 2 items for a bundle." }, { status: 400 });
    }
  }
  const maxImages = listingType === "bundle" ? 5 : 3;
  if (images.length > maxImages) {
    return NextResponse.json({ error: `Maximum ${maxImages} photos for ${listingType} listings.` }, { status: 400 });
  }

  try {
    // Save verified bank details to user profile for future listings
    await db.update(user).set({
      marketAccountNumber:  accountNumber,
      marketBankCode:       bankCode,
      marketAccountName:    accountName,
      marketSellerVerified: true,
    }).where(eq(user.id, session.user.id));

    const cleanBundleItems = (bundleItems as string[]).map((s) => s.trim()).filter(Boolean);

    // expiresAt: 21 days from now (reset to approvedAt + 21 when admin approves)
    const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const [newListing] = await db.insert(marketplaceListing).values({
      id:                  generateId(),
      sellerId:            session.user.id,
      listingType,
      title:               title.trim(),
      category,
      condition,
      description:         description.trim(),
      bundleItems:         cleanBundleItems,
      price:               Math.round(price * 100),
      state,
      lga,
      landmark:            landmark.trim(),
      images,
      hasReceipt:          Boolean(hasReceipt),
      delivery:            delivery ?? "pickup",
      sellerPriceNote:     sellerPriceNote ?? null,
      refPriceMin:         refPriceMin     ? Math.round(refPriceMin * 100)     : null,
      refPriceMax:         refPriceMax     ? Math.round(refPriceMax * 100)     : null,
      refPriceSource:      refPriceSource  ?? null,
      refPriceContext:     refPriceContext  ?? null,
      refPriceGoogleUrl:   refPriceGoogleUrl ?? null,
      bulkMinQty:          bulkMinQty   ? Math.round(bulkMinQty)              : null,
      bulkPrice:           bulkPrice    ? Math.round(bulkPrice)               : null,
      status:              "pending",
      agreementAcceptedAt: new Date(),
      expiresAt,
    }).returning();

    const bundleDetail = listingType === "bundle" && cleanBundleItems.length
      ? `<p><strong>Bundle items:</strong> ${cleanBundleItems.join(", ")}</p>`
      : "";

    await sendAdminEmail(
      `New marketplace listing — ${listingType === "bundle" ? "Bundle: " : ""}${title}`,
      `
        <p><strong>Type:</strong> ${listingType === "bundle" ? "Bundle / Set" : "Single item"}</p>
        <p><strong>Seller:</strong> ${session.user.name} (${session.user.email})</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Category:</strong> ${category} · <strong>Condition:</strong> ${condition}</p>
        <p><strong>Price:</strong> ₦${price.toLocaleString("en-NG")}</p>
        <p><strong>Location:</strong> ${lga}, ${state} — ${landmark}</p>
        ${bundleDetail}
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Has receipt:</strong> ${hasReceipt ? "Yes" : "No"}</p>
        <p><strong>Bank:</strong> ${accountName} — ${accountNumber}</p>
        <p><strong>Photos:</strong> ${images.length} uploaded</p>
        <p><strong>Active listings after this:</strong> ${activeCount + 1} / ${MAX_ACTIVE_LISTINGS}</p>
        <div style="margin: 24px 0;">
          <a href="https://www.corpernest.com.ng/admin/marketplace/listings"
            style="display:inline-block;padding:12px 24px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
            Review &amp; Approve in Admin →
          </a>
        </div>
        <p style="color:#888;font-size:13px;">Listing ID: ${newListing.id}</p>
      `
    );

    return NextResponse.json({ id: newListing.id, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Could not create listing. Try again." }, { status: 500 });
  }
}