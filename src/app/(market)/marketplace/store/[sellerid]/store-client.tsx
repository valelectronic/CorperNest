// src/app/(market)/marketplace/store/[sellerId]/store-client.tsx
"use client";

import { useRouter } from "next/navigation";

type Listing = {
  id:          string;
  title:       string;
  category:    string;
  condition:   string;
  price:       number;
  images:      string[];
  listingType: string;
  lga:         string;
  state:       string;
  landmark:    string;
  refPriceMin: number | null;
  createdAt:   Date | string;
};

type Seller = {
  id:       string;
  name:     string;
  verified: boolean;
  tier:     string;
  joinedAt: Date | string;
};

type Props = {
  seller:         Seller;
  listings:       Listing[];
  completedSales: number;
};

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days  = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (days < 30)  return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

export default function MarketplaceStoreClient({ seller, listings, completedSales }: Props) {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 56, zIndex: 30, padding: "12px 16px", backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>
          Seller Store
        </p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>

        {/* Seller profile card */}
        <div style={{ borderRadius: 16, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", padding: "20px 16px", marginBottom: 20, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>
            {seller.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>
              {seller.name}
            </p>
            {seller.verified && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: "#E8F5E9", color: "#2E7D32" }}>
                ✓ Verified
              </span>
            )}
            {seller.tier === "vendor" && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: "#EEF2FF", color: "#4338CA" }}>
                🏪 Vendor
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
            Joined {timeAgo(seller.joinedAt)}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: "12px", borderRadius: 12, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
                {listings.length}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>Active listings</p>
            </div>
            <div style={{ padding: "12px", borderRadius: 12, backgroundColor: "#F0FDF4", border: "1px solid #A5D6A7" }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#15803D", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
                {completedSales}
              </p>
              <p style={{ fontSize: 11, color: "#2E7D32", margin: 0 }}>Completed sales</p>
            </div>
          </div>
        </div>

        {/* Listings */}
        {listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>No active listings</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>This seller has no items for sale right now.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
              {listings.length} items for sale
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {listings.map((l) => (
                <div key={l.id} onClick={() => router.push(`/marketplace/${l.id}`)}
                  style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden", cursor: "pointer" }}>
                  <div style={{ width: "100%", aspectRatio: "1", backgroundColor: "var(--color-light)", overflow: "hidden" }}>
                    {l.images[0]
                      ? <img src={l.images[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📦</div>
                    }
                  </div>
                  <div style={{ padding: "10px" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.title}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
                      ₦{l.price.toLocaleString("en-NG")}
                    </p>
                    {l.refPriceMin && l.refPriceMin > l.price && (
                      <p style={{ fontSize: 10, color: "#15803D", margin: "0 0 2px", fontWeight: 600 }}>
                        {Math.round(((l.refPriceMin - l.price) / l.refPriceMin) * 100)}% below market
                      </p>
                    )}
                    <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>
                      {l.condition === "new" ? "✨ New" : "♻️ Used"} · {l.lga}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}