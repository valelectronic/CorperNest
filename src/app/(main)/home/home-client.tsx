// src/app/(main)/home/home-client.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PropertyCard, { type PropertyCardData } from "@/components/property-card";
import { getLGAs } from "@/lib/nigeria-location";
import NetworkErrorState from "@/components/network-error-state";

type Props = {
  userName:        string | null;
  initialListings: PropertyCardData[];
  totalCount:      number;
  watchlistedIds:  string[];
};

// ── SKELETON ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <div style={{ height: 210, backgroundColor: "#E8F5E9" }} />
      <div className="px-4 pt-3 pb-4 space-y-2">
        <div className="h-4 rounded-lg w-3/4" style={{ backgroundColor: "#E8F5E9" }} />
        <div className="h-3 rounded-lg w-1/2" style={{ backgroundColor: "#E8F5E9" }} />
        <div className="flex gap-2 mt-3">
          {[1,2,3].map((i) => <div key={i} className="h-6 rounded-lg w-16" style={{ backgroundColor: "#E8F5E9" }} />)}
        </div>
        <div className="h-10 rounded-xl mt-4" style={{ backgroundColor: "#E8F5E9" }} />
      </div>
    </div>
  );
}

// ── ACTIVE FILTER PILL ────────────────────────────────────────────────────────

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 20, flexShrink: 0,
      backgroundColor: "var(--color-light)",
      border: "1.5px solid var(--color-primary)",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-primary)" }}>{label}</span>
      <button onClick={onRemove} style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ── GREETING ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function HomeClient({ userName, initialListings, totalCount, watchlistedIds }: Props) {
  const router = useRouter();

  // Listings
  const [listings,    setListings]    = useState<PropertyCardData[]>(initialListings);
  const [watchedIds,  setWatchedIds]  = useState<Set<string>>(new Set(watchlistedIds));
  const [hasMore,     setHasMore]     = useState(listings.length < totalCount);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError,   setLoadError]   = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [type,        setType]        = useState("");
  const [lga,         setLga]         = useState("");
  const [purpose,     setPurpose]     = useState("");
  const [minPrice,    setMinPrice]    = useState("");
  const [maxPrice,    setMaxPrice]    = useState("");
  const [searchInput, setSearchInput] = useState("");

  const STATE      = "Akwa Ibom";
  const lgaOptions = getLGAs(STATE);

  const PRICE_RANGES = [
    { label: "All prices",  min: "",       max: ""       },
    { label: "Under ₦100k", min: "0",      max: "100000" },
    { label: "₦100–200k",   min: "100000", max: "200000" },
    { label: "₦200–300k",   min: "200000", max: "300000" },
    { label: "₦300–500k",   min: "300000", max: "500000" },
    { label: "Above ₦500k", min: "500000", max: ""       },
  ];

  const TYPE_OPTIONS = [
    { label: "All types",      value: "" },
    { label: "Self Contained", value: "self-con"  },
    { label: "Mini Flat",      value: "mini-flat" },
    { label: "1 Bedroom",      value: "1-bed"     },
    { label: "2 Bedroom",      value: "2-bed"     },
    { label: "3 Bedroom",      value: "3-bed"     },
    { label: "Single Room",    value: "room"      },
  ];

  const priceLabel    = PRICE_RANGES.find((r) => r.min === minPrice && r.max === maxPrice && (r.min || r.max))?.label;
  const typeLabel     = TYPE_OPTIONS.find((t) => t.value === type && t.value)?.label;
  const activeFilters = [typeLabel, lga, purpose, priceLabel].filter(Boolean);
  const activeCount   = activeFilters.length;

  const filtersRef = useRef({ type, lga, purpose, minPrice, maxPrice });
  useEffect(() => { filtersRef.current = { type, lga, purpose, minPrice, maxPrice }; },
    [type, lga, purpose, minPrice, maxPrice]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  function buildQuery(pageNum: number, keyword: string) {
    const f = filtersRef.current;
    const p = new URLSearchParams();
    p.set("page", String(pageNum));
    p.set("state", STATE);
    if (f.type)     p.set("type",     f.type);
    if (f.lga)      p.set("lga",      f.lga);
    if (f.purpose)  p.set("purpose",  f.purpose);
    if (f.minPrice) p.set("minPrice", f.minPrice);
    if (f.maxPrice) p.set("maxPrice", f.maxPrice);
    if (keyword)    p.set("keyword",  keyword);
    return p.toString();
  }

  async function fetchListings(keyword = "", isLoadMore = false, currentPage = 1) {
    if (isLoadMore) setLoadingMore(true);
    else            setLoading(true);
    setLoadError(false);
    try {
      const pageNum = isLoadMore ? currentPage + 1 : 1;
      const res  = await fetch(`/api/properties/feed?${buildQuery(pageNum, keyword)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (isLoadMore) {
        setListings((prev) => {
          const ids = new Set(prev.map((l) => l.id));
          return [...prev, ...(data.listings ?? []).filter((l: PropertyCardData) => !ids.has(l.id))];
        });
        setPage(pageNum);
      } else {
        setListings(data.listings ?? []);
        setPage(1);
      }
      setHasMore(data.hasMore ?? false);
      setHasSearched(true);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => { if (hasSearched) fetchListings(searchInput.trim()); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, lga, purpose, minPrice, maxPrice]);

  function clearFilters() {
    filtersRef.current = { type: "", lga: "", purpose: "", minPrice: "", maxPrice: "" };
    setType(""); setLga(""); setPurpose(""); setMinPrice(""); setMaxPrice("");
    setSearchInput("");
    setHasSearched(false);
    setLoadError(false);
    setListings(initialListings);
    setHasMore(initialListings.length < totalCount);
    setPage(1);
    setFiltersOpen(false);
  }

  function setPrice(min: string, max: string) {
    setMinPrice(min);
    setMaxPrice(max);
  }

  const handleWatchlistChange = useCallback((listingId: string, watching: boolean) => {
    setWatchedIds((prev) => {
      const next = new Set(prev);
      watching ? next.add(listingId) : next.delete(listingId);
      return next;
    });
  }, []);

  const displayed = hasSearched ? listings : initialListings;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "var(--color-bg)", paddingBottom: 32 }}>

      {/* ── STICKY HEADER ── */}
      <div
        className="px-4 py-3"
        style={{
          position: "sticky", top: 56, zIndex: 30,
          backgroundColor: "var(--color-bg)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {/* ── GREETING ── */}
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 10px", fontWeight: 500 }}>
          {getGreeting()}{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
          {!userName && (
            <Link href="/signin" style={{ color: "var(--color-primary)", fontWeight: 600, marginLeft: 6, textDecoration: "none" }}>
              Sign in to save listings
            </Link>
          )}
        </p>

        {/* ── MODE TOGGLE ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{
            padding: "10px 10px", borderRadius: 14, cursor: "default",
            backgroundColor: "var(--color-primary)",
            border: "1.5px solid var(--color-primary)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 4 }}>
              <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                fill="white" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 1px" }}>Find Housing</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", margin: 0 }}>Browse properties</p>
          </div>

          <button onClick={() => router.push("/marketplace")} style={{
            padding: "10px 10px", borderRadius: 14, textAlign: "left",
            backgroundColor: "var(--color-bg)",
            border: "1.5px solid var(--color-border)",
            cursor: "pointer",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 4, display: "block" }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M3 6h18M16 10a4 4 0 01-8 0"
                stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 1px" }}>Marketplace</p>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>Buy and sell items</p>
          </button>
        </div>

        {/* Search + filter button */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flex: 1,
            padding: "10px 12px", borderRadius: 12,
            backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" stroke="var(--color-text-muted)" strokeWidth="1.8" />
              <path d="M21 21l-4.35-4.35" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                if (!val && hasSearched) {
                  setHasSearched(false);
                  setLoadError(false);
                  setListings(initialListings);
                  setHasMore(initialListings.length < totalCount);
                  setPage(1);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && fetchListings(searchInput.trim())}
              placeholder="Search area, keyword…"
              style={{
                flex: 1, minWidth: 0, fontSize: 14, background: "transparent",
                border: "none", outline: "none", color: "var(--color-text)",
              }}
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); if (hasSearched) fetchListings(""); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <button onClick={() => fetchListings(searchInput.trim())}
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              backgroundColor: "var(--color-primary)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2.2" />
              <path d="M21 21l-4.35-4.35" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>

          <button onClick={() => setFiltersOpen(!filtersOpen)} style={{
            position: "relative", width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            backgroundColor: filtersOpen ? "var(--color-primary)" : "var(--color-card)",
            border: "1px solid var(--color-border)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <line x1="4"  y1="6"  x2="20" y2="6"  stroke={filtersOpen ? "white" : "var(--color-text-secondary)"} strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8"  y1="12" x2="20" y2="12" stroke={filtersOpen ? "white" : "var(--color-text-secondary)"} strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="18" x2="20" y2="18" stroke={filtersOpen ? "white" : "var(--color-text-secondary)"} strokeWidth="1.8" strokeLinecap="round" />
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

        {/* Active filter pills */}
        {activeCount > 0 && (
          <div style={{
            display: "flex", gap: 6, overflowX: "auto",
            marginTop: 8, WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          }}>
            {typeLabel  && <FilterPill label={typeLabel}  onRemove={() => { setType("");    if (hasSearched) fetchListings(searchInput.trim()); }} />}
            {lga        && <FilterPill label={lga}        onRemove={() => { setLga("");     if (hasSearched) fetchListings(searchInput.trim()); }} />}
            {purpose    && <FilterPill label={purpose}    onRemove={() => { setPurpose(""); if (hasSearched) fetchListings(searchInput.trim()); }} />}
            {priceLabel && <FilterPill label={priceLabel} onRemove={() => setPrice("", "")} />}
            <button onClick={clearFilters} style={{
              fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)",
              background: "none", border: "none", padding: "4px 6px",
              cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
            }}>
              Clear all
            </button>
          </div>
        )}

        {/* Result count */}
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 8 }}>
          {loading
            ? "Searching…"
            : `${displayed.length} propert${displayed.length === 1 ? "y" : "ies"}`}
          {hasSearched && searchInput && (
            <span style={{ color: "var(--color-primary)", marginLeft: 6 }}>
              for "{searchInput}"
            </span>
          )}
        </p>
      </div>

      {/* ── FILTER PANEL ── */}
      {filtersOpen && (
        <div style={{
          backgroundColor: "var(--color-card)",
          borderBottom: "1px solid var(--color-border)",
          padding: "16px",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Property type
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {TYPE_OPTIONS.map((t) => (
              <button key={t.value} onClick={() => {
                setType(t.value);
                if (hasSearched) {
                  filtersRef.current = { ...filtersRef.current, type: t.value };
                  fetchListings(searchInput.trim());
                }
              }} style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: "1.5px solid",
                borderColor: type === t.value ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: type === t.value ? "var(--color-primary)" : "var(--color-bg)",
                color: type === t.value ? "#fff" : "var(--color-text-muted)",
                cursor: "pointer",
              }}>
                {t.label}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Price range
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {PRICE_RANGES.map((r) => {
              const active = minPrice === r.min && maxPrice === r.max;
              return (
                <button key={r.label} onClick={() => setPrice(r.min, r.max)} style={{
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

          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Area (LGA)
          </p>
          <select value={lga} onChange={(e) => setLga(e.target.value)} style={{
            width: "100%", padding: "10px 12px", borderRadius: 12, fontSize: 13,
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg)", color: "var(--color-text)",
            marginBottom: 16, outline: "none",
          }}>
            <option value="">All areas</option>
            {lgaOptions.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
            Purpose
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["all", "rent", "sale"] as const).map((v) => {
              const active = v === "all" ? purpose === "" : purpose === v;
              return (
                <button key={v} onClick={() => setPurpose(v === "all" ? "" : v)} style={{
                  flex: 1, padding: "9px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                  border: "1.5px solid",
                  borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                  backgroundColor: active ? "var(--color-primary)" : "var(--color-bg)",
                  color: active ? "#fff" : "var(--color-text-secondary)",
                  cursor: "pointer",
                }}>
                  {v === "all" ? "Any" : v === "rent" ? "Rent" : "For Sale"}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {activeCount > 0 && (
              <button onClick={clearFilters} style={{
                flex: 1, padding: "11px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)",
                color: "var(--color-text-muted)", cursor: "pointer",
              }}>
                Clear all
              </button>
            )}
            <button onClick={() => setFiltersOpen(false)} style={{
              flex: 2, padding: "11px", borderRadius: 12, fontSize: 13, fontWeight: 700,
              backgroundColor: "var(--color-primary)", border: "none",
              color: "#fff", cursor: "pointer",
            }}>
              {activeCount > 0 ? `Show results (${activeCount} filter${activeCount > 1 ? "s" : ""})` : "Done"}
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* ── PROPERTY REQUEST BANNER — prominent, above listings ── */}
        <Link href="/request-property" style={{ display: "block", textDecoration: "none" }}>
          <div style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)",
            padding: "18px 16px",
            border: "none",
            boxShadow: "0 4px 20px rgba(46,125,50,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                    fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 8v5M9.5 11H14.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 3px", letterSpacing: "-0.01em" }}>
                  Can't find the right place?
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: "0 0 8px", lineHeight: 1.4 }}>
                  Tell us what you need — we search on your behalf and find verified options within 24–48 hours.
                </p>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 20, padding: "4px 12px",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Request a property →</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Loading skeletons */}
        {loading && <div className="space-y-4">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>}

        {/* Error state */}
        {!loading && loadError && (
          <NetworkErrorState onRetry={() => fetchListings(searchInput.trim(), false, page)} retrying={loading} />
        )}

        {/* Listings */}
        {!loading && !loadError && (
          displayed.length === 0 ? (
            <div className="rounded-2xl p-10 flex flex-col items-center text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#E8F5E9" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="#2E7D32" strokeWidth="1.8" />
                  <path d="M21 21l-4.35-4.35" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                No properties found
              </p>
              <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
                {searchInput
                  ? `No results for "${searchInput}". Try different keywords.`
                  : activeCount > 0
                  ? "No listings match your filters. Try adjusting them."
                  : "No listings available right now."}
              </p>
              <div className="flex flex-col gap-2 w-full">
                {(activeCount > 0 || searchInput) && (
                  <button onClick={clearFilters} className="text-xs font-semibold px-4 py-2.5 rounded-xl"
                    style={{ backgroundColor: "var(--color-light)", color: "var(--color-primary)" }}>
                    Clear filters
                  </button>
                )}
                <Link href="/request-property" className="text-xs font-semibold px-4 py-2.5 rounded-xl"
                  style={{ backgroundColor: "var(--color-primary)", color: "#fff", textDecoration: "none" }}>
                  Request this property instead →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((l) => (
                <PropertyCard key={l.id} listing={l} isLoggedIn
                  isWatchlisted={watchedIds.has(l.id)} onWatchlistChange={handleWatchlistChange} />
              ))}

              {hasMore && (
                loadingMore
                  ? <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
                  : <button onClick={() => fetchListings(searchInput.trim(), true, page)}
                      className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                      style={{ backgroundColor: "var(--color-card)", border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                      Load more properties
                    </button>
              )}

              {!hasMore && displayed.length > 0 && (
                <p className="text-xs text-center pb-4" style={{ color: "var(--color-text-muted)" }}>
                  You've seen all available properties
                </p>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}