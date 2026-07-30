// src/app/api/marketplace/og/[id]/route.tsx
// Generates share image for WhatsApp, Twitter etc.
// Reference price only shown when listing is genuinely below new price.

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketplaceListing, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [row] = await db
    .select({
      title:          marketplaceListing.title,
      price:          marketplaceListing.price,
      condition:      marketplaceListing.condition,
      lga:            marketplaceListing.lga,
      state:          marketplaceListing.state,
      images:         marketplaceListing.images,
      category:       marketplaceListing.category,
      listingType:    marketplaceListing.listingType,
      hasReceipt:     marketplaceListing.hasReceipt,
      refPriceMin:    marketplaceListing.refPriceMin,
      refPriceMax:    marketplaceListing.refPriceMax,
      sellerName:     user.name,
      sellerVerified: user.marketSellerVerified,
    })
    .from(marketplaceListing)
    .innerJoin(user, eq(marketplaceListing.sellerId, user.id))
    .where(eq(marketplaceListing.id, id))
    .limit(1);

  if (!row) return new Response("Not found", { status: 404 });

  const price     = row.price / 100;
  const priceStr  = `₦${price.toLocaleString("en-NG")}`;
  const refMin    = row.refPriceMin ? row.refPriceMin / 100 : null;
  const refMax    = row.refPriceMax ? row.refPriceMax / 100 : null;

  // Only show savings when listing is genuinely BELOW new price
  const isBelowNew = refMin !== null && price < refMin;
  const saving     = isBelowNew && refMin ? Math.round(((refMin - price) / refMin) * 100) : 0;

  const photoUrl  = (row.images ?? [])[0] ?? null;
  const condLabel = row.condition === "new" ? "✨ New" : row.condition === "fairly-used" ? "♻️ Fairly Used" : "🔀 Mixed";

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "row", backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>

        {/* Left — photo */}
        <div style={{ width: 630, height: 630, position: "relative", flexShrink: 0, backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={row.title} width={630} height={630} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          ) : (
            <div style={{ fontSize: 120, display: "flex" }}>📦</div>
          )}
          {/* Savings badge — only when genuinely cheaper than new */}
          {isBelowNew && saving >= 10 && (
            <div style={{ position: "absolute", bottom: 20, left: 20, backgroundColor: "#15803d", color: "white", padding: "8px 16px", borderRadius: 100, fontSize: 22, fontWeight: 800, display: "flex" }}>
              ↓ {saving}% below new price
            </div>
          )}
        </div>

        {/* Right — details */}
        <div style={{ flex: 1, padding: "48px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#ffffff" }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "white", fontSize: 18, fontWeight: 800, display: "flex" }}>C</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a", display: "flex" }}>CorperNest Marketplace</div>
          </div>

          {/* Title + price */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
            <div style={{ fontSize: row.title.length > 40 ? 32 : 38, fontWeight: 800, color: "#111827", lineHeight: 1.2, display: "flex", flexWrap: "wrap" }}>
              {row.title}
            </div>

            <div style={{ fontSize: 48, fontWeight: 900, color: "#16a34a", display: "flex" }}>
              {priceStr}
            </div>

            {/* Reference price — only shown when listing is below new price */}
            {isBelowNew && refMin && refMax && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 18, color: "#6b7280", display: "flex" }}>New price:</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#374151", display: "flex" }}>
                  ₦{refMin.toLocaleString("en-NG")} – ₦{refMax.toLocaleString("en-NG")}
                </div>
              </div>
            )}

            {/* Badges */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ padding: "6px 14px", borderRadius: 100, backgroundColor: "#f0fdf4", color: "#15803d", fontSize: 16, fontWeight: 700, border: "1.5px solid #86efac", display: "flex" }}>
                {condLabel}
              </div>
              {row.hasReceipt && (
                <div style={{ padding: "6px 14px", borderRadius: 100, backgroundColor: "#eff6ff", color: "#1d4ed8", fontSize: 16, fontWeight: 700, border: "1.5px solid #bfdbfe", display: "flex" }}>
                  📄 Receipt available
                </div>
              )}
              {row.sellerVerified && (
                <div style={{ padding: "6px 14px", borderRadius: 100, backgroundColor: "#f0fdf4", color: "#15803d", fontSize: 16, fontWeight: 700, border: "1.5px solid #86efac", display: "flex" }}>
                  ✓ Verified seller
                </div>
              )}
            </div>
          </div>

          {/* Bottom — location */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 18, color: "#6b7280", display: "flex" }}>
              📍 {row.lga}, {row.state}
            </div>
            <div style={{ fontSize: 16, color: "#9ca3af", display: "flex" }}>
              {row.sellerName ?? "Verified seller"} · Buy via Escrow · Safe & secure
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}