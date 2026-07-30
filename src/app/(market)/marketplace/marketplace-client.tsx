// src/app/(market)/marketplace/marketplace-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneVerificationModal from "@/components/phone-verification-modal";

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type MarketListing = {
  id:               string;
  listingType:      string;
  title:            string;
  category:         string;
  condition:        string;
  price:            number;
  state:            string;
  lga:              string;
  landmark:         string;
  images:           string[];
  bundleItems:      string[];
  status:           string;
  createdAt:        Date | string;
  sellerName:       string;
  sellerVendorTier: string | null;
  sellerVerified:   boolean | null;
  refPriceMin:      number | null; // AI estimated new price — for savings badge
};

type Props = {
  initialListings:  MarketListing[];
  hasMoreInitial:   boolean;
  hasVerifiedPhone: boolean;
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "",            label: "All",          emoji: "🔍" },
  { value: "Furniture",   label: "Furniture",    emoji: "🛋️" },
  { value: "Electronics", label: "Electronics",  emoji: "📱" },
  { value: "Kitchen",     label: "Kitchen",      emoji: "🍳" },
  { value: "Clothing",    label: "Clothing",     emoji: "👕" },
  { value: "Appliances",  label: "Appliances",   emoji: "🔌" },
  { value: "Books",       label: "Books",        emoji: "📚" },
  { value: "Sports",      label: "Sports",       emoji: "🏋️" },
  { value: "Other",       label: "Other",        emoji: "📦" },
];

const CONDITIONS = [
  { value: "",            label: "Any condition" },
  { value: "new",         label: "✨ New"         },
  { value: "fairly-used", label: "♻️ Used"        },
  { value: "mixed",       label: "🔀 Mixed"       },
];

const PRICE_RANGES = [
  { label: "Any price",    min: "",       max: ""       },
  { label: "Under ₦10k",  min: "0",      max: "10000"  },
  { label: "₦10k – ₦30k", min: "10000",  max: "30000"  },
  { label: "₦30k – ₦100k",min: "30000",  max: "100000" },
  { label: "Above ₦100k", min: "100000", max: ""       },
];

// ── SKELETON ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <div style={{ height: 150, backgroundColor: "#E8F5E9" }} />
      <div style={{ padding: "10px 10px 12px" }}>
        <div style={{ height: 12, borderRadius: 6, backgroundColor: "#E8F5E9", marginBottom: 6, width: "80%" }} />
        <div style={{ height: 10, borderRadius: 6, backgroundColor: "#E8F5E9", marginBottom: 8, width: "55%" }} />
        <div style={{ height: 14, borderRadius: 6, backgroundColor: "#E8F5E9", width: "45%" }} />
      </div>
    </div>
  );
}

// ── ITEM CARD ─────────────────────────────────────────────────────────────────

function ItemCard({ item, onClick }: { item: MarketListing; onClick: () => void }) {
  const isBundle   = item.listingType === "bundle";
  const isVendor   = item.sellerVendorTier === "vendor";
  const isSold     = item.status === "sold";
  const isReserved = item.status === "reserved";

  const condBadge: Record<string, { bg: string; text: string; label: string }> = {
    "new":         { bg: "#E8F5E9", text: "#2E7D32", label: "New"   },
    "fairly-used": { bg: "#FFF8E1", text: "#92400E", label: "Used"  },
    "mixed":       { bg: "#F3E8FF", text: "#6B21A8", label: "Mixed" },
  };
  const cond = condBadge[item.condition] ?? condBadge["fairly-used"];

  // Format listing date
  const listedDate = new Date(item.createdAt);
  const now        = new Date();
  const diffDays   = Math.floor((now.getTime() - listedDate.getTime()) / 86400000);
  const dateLabel  = diffDays === 0 ? "Today"
    : diffDays === 1 ? "Yesterday"
    : diffDays < 7   ? `${diffDays}d ago`
    : diffDays < 30  ? `${Math.floor(diffDays / 7)}w ago`
    : `${Math.floor(diffDays / 30)}mo ago`;

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden", textAlign: "left", width: "100%",
      backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)",
      opacity: isSold ? 0.55 : 1, display: "flex", flexDirection: "column",
    }}>
      {/* Photo — tappable, goes to detail page */}
      <button onClick={onClick} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", display: "block", width: "100%" }}>
        <div style={{ position: "relative", aspectRatio: "1", backgroundColor: "var(--color-light)", overflow: "hidden" }}>
          {item.images.length > 0 ? (
            <img src={item.images[0]} alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 40 }}>
                {CATEGORIES.find((c) => c.value === item.category)?.emoji ?? "📦"}
              </span>
            </div>
          )}

          {isBundle && (
            <span style={{
              position: "absolute", top: 7, left: 7, fontSize: 9, fontWeight: 700,
              padding: "2px 7px", borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)",
            }}>
              Bundle {item.bundleItems.length > 0 ? `${item.bundleItems.length} items` : ""}
            </span>
          )}

          <span style={{
            position: "absolute", top: 7, right: 7, fontSize: 9, fontWeight: 700,
            padding: "2px 7px", borderRadius: 20,
            backgroundColor: isVendor ? "#E8F5E9" : "rgba(255,255,255,0.92)",
            color: isVendor ? "#2E7D32" : "#555",
          }}>
            {isVendor ? "✓ Vendor" : "✓ Verified"}
          </span>

          {isSold && (
            <div style={{
              position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.38)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", backgroundColor: "rgba(0,0,0,0.65)", padding: "4px 14px", borderRadius: 20 }}>
                Sold
              </span>
            </div>
          )}
          {item.status === "reserving" && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(251,191,36,0.92)", padding: "4px 0", textAlign: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#92400E" }}>🔒 Being reserved</span>
            </div>
          )}
        </div>
      </button>

      {/* Info — tappable, goes to detail page */}
      <button onClick={onClick} style={{ padding: "10px 10px 8px", border: "none", background: "none", cursor: "pointer", textAlign: "left", flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>
            {item.lga}, {item.state}
          </p>
          <p style={{ fontSize: 9, color: "var(--color-text-muted)", margin: 0 }}>
            {dateLabel}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
            ₦{item.price.toLocaleString("en-NG")}
          </p>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20, backgroundColor: cond.bg, color: cond.text, flexShrink: 0 }}>
            {cond.label}
          </span>
        </div>
        {/* Savings badge */}
        {item.refPriceMin && item.price < item.refPriceMin && (
          <p style={{ fontSize: 9, fontWeight: 700, color: "#15803D", margin: "4px 0 0", backgroundColor: "#F0FDF4", padding: "2px 6px", borderRadius: 6, display: "inline-block" }}>
            ↓ {Math.round(((item.refPriceMin - item.price) / item.refPriceMin) * 100)}% below new price
          </p>
        )}
        {isReserved && (
          <p style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600, margin: "4px 0 0" }}>Reserved</p>
        )}
      </button>

    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function MarketplaceClient({ initialListings, hasMoreInitial, hasVerifiedPhone }: Props) {
  const router = useRouter();

  const [listings,       setListings]       = useState<MarketListing[]>(initialListings);
  const [hasMore,        setHasMore]        = useState(hasMoreInitial);
  const [page,           setPage]           = useState(1);
  const [loading,        setLoading]        = useState(false);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [hasSearched,    setHasSearched]    = useState(false);
  const [filterOpen,     setFilterOpen]     = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  // Buy chip loading state — must be at top level, never inside conditional render
  const [pendingBuyId,   setPendingBuyId]   = useState<string | null>(null);

  const [keyword,   setKeyword]   = useState("");
  const [category,  setCategory]  = useState("");
  const [condition, setCondition] = useState("");
  const [minPrice,  setMinPrice]  = useState("");
  const [maxPrice,  setMaxPrice]  = useState("");

  const activeCount = [
    condition,
    minPrice || maxPrice ? "price" : "",
  ].filter(Boolean).length;

  const priceLabel = PRICE_RANGES.find(
    (r) => r.min === minPrice && r.max === maxPrice && (r.min || r.max)
  )?.label;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  async function fetchListings(
    kw = keyword, cat = category, cond = condition,
    min = minPrice, max = maxPrice,
    isLoadMore = false, currentPage = page,
  ) {
    if (isLoadMore) setLoadingMore(true);
    else            setLoading(true);

    try {
      const p = isLoadMore ? currentPage + 1 : 1;
      const params = new URLSearchParams({ page: String(p) });
      if (cat)  params.set("category",  cat);
      if (cond) params.set("condition", cond);
      if (min)  params.set("minPrice",  min);
      if (max)  params.set("maxPrice",  max);
      if (kw)   params.set("keyword",   kw);

      const res  = await fetch(`/api/marketplace/listings/feed?${params}`);
      const data = await res.json();

      if (isLoadMore) {
        setListings((prev) => {
          const ids = new Set(prev.map((l) => l.id));
          return [...prev, ...(data.listings ?? []).filter((l: MarketListing) => !ids.has(l.id))];
        });
        setPage(p);
      } else {
        setListings(data.listings ?? []);
        setPage(1);
      }
      setHasMore(data.hasMore ?? false);
      setHasSearched(true);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleCategory(cat: string) {
    setCategory(cat);
    fetchListings(keyword, cat, condition, minPrice, maxPrice);
  }

  function applyFilters(cond: string, min: string, max: string) {
    setCondition(cond);
    setMinPrice(min);
    setMaxPrice(max);
    setFilterOpen(false);
    fetchListings(keyword, category, cond, min, max);
  }

  function clearAll() {
    setKeyword(""); setCategory(""); setCondition("");
    setMinPrice(""); setMaxPrice("");
    setListings(initialListings);
    setHasMore(hasMoreInitial);
    setPage(1);
    setHasSearched(false);
    setFilterOpen(false);
  }

  const displayed = hasSearched ? listings : initialListings;

  return (
    <div style={{ backgroundColor: "var(--color-bg)", paddingBottom: 32 }}>

      {/* ── STICKY SEARCH + CATEGORY BAR ── */}
      <div style={{
        position: "sticky", top: 56, zIndex: 30,
        backgroundColor: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        padding: "10px 16px 10px",
      }}>

        {/* Search + filter button — single row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flex: 1,
            padding: "9px 12px", borderRadius: 12,
            backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" stroke="var(--color-text-muted)" strokeWidth="1.8" />
              <path d="M21 21l-4.35-4.35" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text" value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchListings(keyword)}
              placeholder="Search items…"
              style={{ flex: 1, fontSize: 14, background: "transparent", border: "none", outline: "none", color: "var(--color-text)" }}
            />
            {keyword && (
              <button onClick={() => { setKeyword(""); if (hasSearched) fetchListings(""); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Search */}
          <button onClick={() => fetchListings(keyword)} style={{
            width: 44, height: 44, flexShrink: 0, borderRadius: 12,
            backgroundColor: "var(--color-primary)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2.2" />
              <path d="M21 21l-4.35-4.35" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Filter */}
          <button onClick={() => setFilterOpen(!filterOpen)} style={{
            position: "relative", width: 44, height: 44, flexShrink: 0, borderRadius: 12,
            backgroundColor: filterOpen ? "var(--color-primary)" : "var(--color-card)",
            border: "1px solid var(--color-border)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <line x1="4"  y1="6"  x2="20" y2="6"  stroke={filterOpen ? "white" : "var(--color-text-secondary)"} strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8"  y1="12" x2="20" y2="12" stroke={filterOpen ? "white" : "var(--color-text-secondary)"} strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="18" x2="20" y2="18" stroke={filterOpen ? "white" : "var(--color-text-secondary)"} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {activeCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: "#E53935", color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Categories — horizontal scroll, no wrap */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", margin: "0 -16px", padding: "0 16px", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            return (
              <button key={cat.value} onClick={() => handleCategory(cat.value)} style={{
                display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: "1.5px solid",
                borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: active ? "var(--color-primary)" : "var(--color-bg)",
                color: active ? "#fff" : "var(--color-text-muted)",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Active filter pills */}
        {(condition || priceLabel) && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {condition && (
              <span style={{
                display: "flex", alignItems: "center", gap: 5, padding: "3px 10px",
                borderRadius: 20, backgroundColor: "var(--color-light)",
                border: "1.5px solid var(--color-primary)", fontSize: 11, fontWeight: 600, color: "var(--color-primary)",
              }}>
                {CONDITIONS.find((c) => c.value === condition)?.label}
                <button onClick={() => applyFilters("", minPrice, maxPrice)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            )}
            {priceLabel && (
              <span style={{
                display: "flex", alignItems: "center", gap: 5, padding: "3px 10px",
                borderRadius: 20, backgroundColor: "var(--color-light)",
                border: "1.5px solid var(--color-primary)", fontSize: 11, fontWeight: 600, color: "var(--color-primary)",
              }}>
                {priceLabel}
                <button onClick={() => applyFilters(condition, "", "")}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "8px 0 0" }}>
          {loading ? "Searching…" : `${displayed.length} item${displayed.length === 1 ? "" : "s"}`}
          {keyword && <span style={{ color: "var(--color-primary)", marginLeft: 6 }}>for "{keyword}"</span>}
        </p>
      </div>

      {/* ── FILTER PANEL — outside sticky, scrolls away ── */}
      {filterOpen && (
        <div style={{
          backgroundColor: "var(--color-card)",
          borderBottom: "1px solid var(--color-border)",
          padding: 16,
        }}>
          {/* Condition */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Condition
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {CONDITIONS.map((c) => (
              <button key={c.value} onClick={() => setCondition(c.value)} style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: "1.5px solid",
                borderColor: condition === c.value ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: condition === c.value ? "var(--color-primary)" : "var(--color-bg)",
                color: condition === c.value ? "#fff" : "var(--color-text-muted)",
                cursor: "pointer",
              }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Price */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Price range
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {PRICE_RANGES.map((r) => {
              const active = minPrice === r.min && maxPrice === r.max;
              return (
                <button key={r.label} onClick={() => { setMinPrice(r.min); setMaxPrice(r.max); }} style={{
                  padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: "1.5px solid",
                  borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                  backgroundColor: active ? "var(--color-primary)" : "var(--color-bg)",
                  color: active ? "#fff" : "var(--color-text-muted)",
                  cursor: "pointer",
                }}>
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            {activeCount > 0 && (
              <button onClick={clearAll} style={{
                flex: 1, padding: 11, borderRadius: 12, fontSize: 13, fontWeight: 600,
                backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)",
                color: "var(--color-text-muted)", cursor: "pointer",
              }}>
                Clear all
              </button>
            )}
            <button onClick={() => applyFilters(condition, minPrice, maxPrice)} style={{
              flex: 2, padding: 11, borderRadius: 12, fontSize: 13, fontWeight: 700,
              backgroundColor: "var(--color-primary)", border: "none",
              color: "#fff", cursor: "pointer",
            }}>
              {activeCount > 0 ? `Show results (${activeCount} filter${activeCount > 1 ? "s" : ""})` : "Done"}
            </button>
          </div>
        </div>
      )}

      {/* ── ITEM GRID ── */}
      <div style={{ padding: "12px 16px 0" }}>

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div style={{
            padding: "48px 24px", textAlign: "center",
            backgroundColor: "var(--color-card)", borderRadius: 16,
            border: "1px solid var(--color-border)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px", fontFamily: "var(--font-heading)" }}>
              No items found
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
              {keyword
                ? `Nothing matching "${keyword}". Try different keywords.`
                : activeCount > 0
                ? "Nothing matches your filters. Try adjusting them."
                : "No listings yet — be the first to sell something."}
            </p>
            {(activeCount > 0 || keyword) && (
              <button onClick={clearAll} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                backgroundColor: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer",
              }}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {displayed.map((item) => (
                <ItemCard key={item.id} item={item}
                  onClick={() => router.push(`/marketplace/${item.id}`)}
                />
              ))}
            </div>
            {showPhoneModal && (
              <PhoneVerificationModal
                onClose={() => { setShowPhoneModal(false); setPendingBuyId(null); }}
                onVerified={() => {
                  setShowPhoneModal(false);
                  if (pendingBuyId) {
                    router.push(`/marketplace/${pendingBuyId}?buy=1`);
                    setPendingBuyId(null);
                  }
                }}
              />
            )}
          </>
        )}

        {!loading && hasMore && (
          <div style={{ marginTop: 14 }}>
            {loadingMore ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <SkeletonCard /><SkeletonCard />
              </div>
            ) : (
              <button onClick={() => fetchListings(keyword, category, condition, minPrice, maxPrice, true, page)}
                style={{
                  width: "100%", padding: 13, borderRadius: 12, fontSize: 13, fontWeight: 600,
                  backgroundColor: "var(--color-card)", border: "1.5px solid var(--color-border)",
                  color: "var(--color-text-secondary)", cursor: "pointer",
                }}>
                Load more items
              </button>
            )}
          </div>
        )}

        {!loading && !hasMore && displayed.length > 0 && (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
            You've seen all available items
          </p>
        )}
      </div>
    </div>
  );
}