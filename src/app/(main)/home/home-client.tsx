// src/app/(main)/home/home-client.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import PropertyCard, { type PropertyCardData } from "@/components/property-card";
import { getLGAs } from "@/lib/nigeria-location";
import NetworkErrorState from "@/components/network-error-state";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "",          label: "All types"     },
  { value: "self-con",  label: "Self Contained" },
  { value: "mini-flat", label: "Mini Flat"      },
  { value: "1-bed",     label: "1 Bedroom"      },
  { value: "2-bed",     label: "2 Bedroom"      },
  { value: "room",      label: "Single Room"    },
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Props = {
  userName: string;
  initialListings: PropertyCardData[];
  totalCount: number;
  pageSize: number;
  watchlistedIds: string[];
};

// ─── SKELETON ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
    >
      <div style={{ height: 210, backgroundColor: "#E8F5E9" }} />
      <div className="px-4 pt-3 pb-4 space-y-2">
        <div className="h-4 rounded-lg w-3/4" style={{ backgroundColor: "#E8F5E9" }} />
        <div className="h-3 rounded-lg w-1/2" style={{ backgroundColor: "#E8F5E9" }} />
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 rounded-lg w-16" style={{ backgroundColor: "#E8F5E9" }} />
          ))}
        </div>
        <div className="h-10 rounded-xl mt-4" style={{ backgroundColor: "#E8F5E9" }} />
      </div>
    </div>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function HomeClient({
  userName,
  initialListings,
  totalCount,
  watchlistedIds,
}: Props) {
  void userName; // no longer shown directly — banner is depersonalized

  // ── Listings state ────────────────────────────────────────────────────────
  const [listings, setListings]       = useState<PropertyCardData[]>(initialListings);
  const [watchedIds, setWatchedIds]   = useState<Set<string>>(new Set(watchlistedIds));
  const [hasMore, setHasMore]         = useState(listings.length < totalCount);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError]     = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lga, setLga]                 = useState("");
  const [type, setType]               = useState("");
  const [purpose, setPurpose]         = useState("");
  const [minPriceRaw, setMinPriceRaw] = useState("");
  const [maxPriceRaw, setMaxPriceRaw] = useState("");
  const [minPrice, setMinPrice]       = useState("");
  const [maxPrice, setMaxPrice]       = useState("");
  const [searchInput, setSearchInput] = useState("");

  const STATE = "Akwa Ibom";
  const lgaOptions = getLGAs(STATE);

  const activeFilterCount = [lga, type, purpose, minPrice, maxPrice].filter(Boolean).length;

  const filtersRef = useRef({ lga, type, purpose, minPrice, maxPrice });
  useEffect(() => {
    filtersRef.current = { lga, type, purpose, minPrice, maxPrice };
  }, [lga, type, purpose, minPrice, maxPrice]);

  useEffect(() => {
    const t = setTimeout(() => setMinPrice(minPriceRaw), 800);
    return () => clearTimeout(t);
  }, [minPriceRaw]);

  useEffect(() => {
    const t = setTimeout(() => setMaxPrice(maxPriceRaw), 800);
    return () => clearTimeout(t);
  }, [maxPriceRaw]);

  function buildQuery(pageNum: number, keyword: string) {
    const f = filtersRef.current;
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("state", STATE);
    if (f.lga)      params.set("lga", f.lga);
    if (f.type)     params.set("type", f.type);
    if (f.purpose)  params.set("purpose", f.purpose);
    if (f.minPrice) params.set("minPrice", f.minPrice.replace(/,/g, ""));
    if (f.maxPrice) params.set("maxPrice", f.maxPrice.replace(/,/g, ""));
    if (keyword)    params.set("keyword", keyword);
    return params.toString();
  }

  async function fetchListings(keyword = "", isLoadMore = false, currentPage = 1) {
    if (isLoadMore) setLoadingMore(true);
    else            setLoading(true);
    setLoadError(false);

    try {
      const pageNum = isLoadMore ? currentPage + 1 : 1;
      const res  = await fetch(`/api/properties/feed?${buildQuery(pageNum, keyword)}`);
      if (!res.ok) throw new Error("Feed request failed");
      const data = await res.json();

      if (isLoadMore) {
        setListings((prev) => [...prev, ...(data.listings ?? [])]);
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

  function handleSearch() {
    fetchListings(searchInput.trim());
  }

  useEffect(() => {
    if (hasSearched) fetchListings(searchInput.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lga, type, purpose]);

  useEffect(() => {
    if (hasSearched) fetchListings(searchInput.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice]);

  function clearFilters() {
  filtersRef.current = {
    lga:      "",
    type:     "",
    purpose:  "",
    minPrice: "",
    maxPrice: "",
  };
  setLga("");
  setType("");
  setPurpose("");
  setMinPriceRaw("");
  setMaxPriceRaw("");
  setMinPrice("");
  setMaxPrice("");
  setSearchInput("");
  setHasSearched(false);
  setLoadError(false);
  setListings(initialListings);
  setHasMore(initialListings.length < totalCount);
  setPage(1);
}

  const handleWatchlistChange = useCallback((listingId: string, watching: boolean) => {
    setWatchedIds((prev) => {
      const next = new Set(prev);
      watching ? next.add(listingId) : next.delete(listingId);
      return next;
    });
  }, []);

  const displayedListings = hasSearched ? listings : initialListings;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ── STICKY SEARCH + FILTER BAR ── */}
      <div
        className="sticky top-0 z-30 px-4 py-3 space-y-3"
        style={{ backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex gap-2">
          <div
            className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <circle cx="11" cy="11" r="8" stroke="var(--color-text-muted)" strokeWidth="1.8" />
              <path d="M21 21l-4.35-4.35" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (val === "" && hasSearched) {
                filtersRef.current = { lga, type, purpose, minPrice, maxPrice };
                setHasSearched(false);
                setLoadError(false);
                setListings(initialListings);
                setHasMore(initialListings.length < totalCount);
                setPage(1);
              }
            }}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search area, keyword..."
              className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
              style={{ color: "var(--color-text)" }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); if (hasSearched) fetchListings(""); }}
                className="shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{
              width: 44,
              height: 44,
              backgroundColor: "var(--color-primary)",
              border: "none",
            }}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2.2" />
              <path d="M21 21l-4.35-4.35" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="relative flex items-center justify-center rounded-xl shrink-0"
            style={{
              width: 44,
              height: 44,
              backgroundColor: filtersOpen ? "var(--color-primary)" : "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
            aria-label="Filters"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <line x1="4"  y1="6"  x2="20" y2="6"
                stroke={filtersOpen ? "white" : "var(--color-text-secondary)"}
                strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8"  y1="12" x2="20" y2="12"
                stroke={filtersOpen ? "white" : "var(--color-text-secondary)"}
                strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="18" x2="20" y2="18"
                stroke={filtersOpen ? "white" : "var(--color-text-secondary)"}
                strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: "#E53935", color: "#fff", fontSize: 9 }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>LGA</label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                >
                  <option value="">All LGAs</option>
                  {lgaOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                >
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Purpose</label>
              <div className="flex gap-2">
                {(["all", "rent", "sale"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setPurpose(v === "all" ? "" : v)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      backgroundColor: (v === "all" ? purpose === "" : purpose === v)
                        ? "var(--color-primary)" : "var(--color-bg)",
                      color: (v === "all" ? purpose === "" : purpose === v)
                        ? "#fff" : "var(--color-text-secondary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {v === "all" ? "Any" : v === "rent" ? "Rent" : "Sale"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
                Price range (₦) — updates after you stop typing
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text" inputMode="numeric" value={minPriceRaw}
                  onChange={(e) => setMinPriceRaw(e.target.value)}
                  placeholder="Min e.g. 100000"
                  className="text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                />
                <input
                  type="text" inputMode="numeric" value={maxPriceRaw}
                  onChange={(e) => setMaxPriceRaw(e.target.value)}
                  placeholder="Max e.g. 300000"
                  className="text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="w-full py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {loading
              ? "Searching…"
              : `${displayedListings.length} propert${displayedListings.length === 1 ? "y" : "ies"}`}
          </p>
          {hasSearched && searchInput && (
            <p className="text-xs" style={{ color: "var(--color-primary)" }}>
              Results for "{searchInput}"
            </p>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* Welcome banner — trimmed, no personal name */}
        {!hasSearched && !loadError && (
          <div
            className="rounded-2xl px-4 py-4"
            style={{ background: "linear-gradient(135deg, #1B2E1B 0%, #2E7D32 100%)" }}
          >
            <p className="text-xs mb-1" style={{ color: "#7A9A7A", letterSpacing: "0.5px" }}>
              FIND YOUR HOME
            </p>
            <p className="text-xs" style={{ color: "#A5C8A5" }}>
              Verified properties in Akwa Ibom — inspect before you pay rent.
            </p>
          </div>
        )}

        {/* Request a Property — bold, high-contrast, impossible to miss.
            Previously used var(--color-light) background which looked
            identical to every other card and got scrolled past entirely.
            Now uses a vivid gradient that visually shouts "this is an
            action, tap it" — deliberately distinct from listing cards. */}
        {!hasSearched && !loadError && (
          <Link
            href="/request-property"
            style={{
              display: "block", textDecoration: "none",
              background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
              borderRadius: 18,
              padding: "20px 18px",
              border: "2px solid #43A047",
              boxShadow: "0 4px 20px rgba(46,125,50,0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="#fff" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11 8v6M8 11h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 800, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
                  Can't find what you want?
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>
                  Tell us exactly what you need — we'll hunt for it
                </p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", gap: 16 }}>
              {["Free to request", "7-day active window", "No payment until you book"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#A5D6A7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap" }}>{t}</span>
                </div>
              ))}
            </div>
          </Link>
        )}

        {/* Skeleton loader */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Network error state */}
        {!loading && loadError && (
          <NetworkErrorState
            onRetry={() => fetchListings(searchInput.trim(), false, page)}
            retrying={loading}
          />
        )}

        {/* Listings */}
        {!loading && !loadError && (
          displayedListings.length === 0 ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#E8F5E9" }}
              >
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
                  : activeFilterCount > 0
                  ? "No listings match your filters. Try adjusting them."
                  : "No listings available in Akwa Ibom right now."}
              </p>
              <div className="flex flex-col gap-2 w-full">
                {(activeFilterCount > 0 || searchInput) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold px-4 py-2.5 rounded-xl"
                    style={{ backgroundColor: "var(--color-light)", color: "var(--color-primary)" }}
                  >
                    Clear filters
                  </button>
                )}
                <Link
                  href="/request-property"
                  className="text-xs font-semibold px-4 py-2.5 rounded-xl"
                  style={{ backgroundColor: "var(--color-primary)", color: "#fff", textDecoration: "none" }}
                >
                  Request this property instead →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedListings.map((l) => (
                <PropertyCard
                  key={l.id}
                  listing={l}
                  isLoggedIn
                  isWatchlisted={watchedIds.has(l.id)}
                  onWatchlistChange={handleWatchlistChange}
                />
              ))}

              {hasMore && (
                loadingMore ? (
                  <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : (
                  <button
                    onClick={() => fetchListings(searchInput.trim(), true, page)}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                    style={{
                      backgroundColor: "var(--color-card)",
                      border: "1.5px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Load more properties
                  </button>
                )
              )}

              {!hasMore && displayedListings.length > 0 && (
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