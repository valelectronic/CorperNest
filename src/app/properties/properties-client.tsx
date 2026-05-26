"use client";

import { useState, useEffect, useRef } from "react";
import PropertyCard, { type PropertyCardData } from "@/components/property-card";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";

const PROPERTY_TYPES = [
  { value: "",          label: "All types" },
  { value: "self-con",  label: "Self Contained" },
  { value: "mini-flat", label: "Mini Flat" },
  { value: "1-bed",     label: "1 Bedroom" },
  { value: "2-bed",     label: "2 Bedroom" },
  { value: "room",      label: "Single Room" },
];

type Props = { isLoggedIn: boolean };

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <div style={{ height: "210px", backgroundColor: "#E8F5E9" }} />
      <div className="px-4 pt-3 pb-4 space-y-2">
        <div className="h-4 rounded-lg w-3/4" style={{ backgroundColor: "#E8F5E9" }} />
        <div className="h-3 rounded-lg w-1/2" style={{ backgroundColor: "#E8F5E9" }} />
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-6 rounded-lg w-16" style={{ backgroundColor: "#E8F5E9" }} />)}
        </div>
        <div className="h-10 rounded-xl mt-4" style={{ backgroundColor: "#E8F5E9" }} />
      </div>
    </div>
  );
}

export default function PropertiesClient({ isLoggedIn }: Props) {
  const [listings, setListings] = useState<PropertyCardData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [state, setState] = useState("Akwa Ibom");
  const [lga, setLga] = useState("");
  const [type, setType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [minPriceRaw, setMinPriceRaw] = useState("");
  const [maxPriceRaw, setMaxPriceRaw] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounced price values — only update after 800ms of no typing
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Ref to hold latest filter values for use inside fetch
  // Avoids stale closure issues that caused search not working
  const filtersRef = useRef({ state, lga, type, purpose, minPrice, maxPrice });

  const lgaOptions = getLGAs(state);
  const activeFilterCount = [lga, type, purpose, minPrice, maxPrice].filter(Boolean).length;

  // Keep ref in sync with latest filter values
  useEffect(() => {
    filtersRef.current = { state, lga, type, purpose, minPrice, maxPrice };
  }, [state, lga, type, purpose, minPrice, maxPrice]);

  // Debounce min price
  useEffect(() => {
    const timer = setTimeout(() => setMinPrice(minPriceRaw), 800);
    return () => clearTimeout(timer);
  }, [minPriceRaw]);

  // Debounce max price
  useEffect(() => {
    const timer = setTimeout(() => setMaxPrice(maxPriceRaw), 800);
    return () => clearTimeout(timer);
  }, [maxPriceRaw]);

  // Build query from current filters — reads from ref so always fresh
  function buildQuery(pageNum: number, keyword: string) {
    const f = filtersRef.current;
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("state", f.state);
    if (f.lga)      params.set("lga", f.lga);
    if (f.type)     params.set("type", f.type);
    if (f.purpose)  params.set("purpose", f.purpose);
    if (f.minPrice) params.set("minPrice", f.minPrice.replace(/,/g, ""));
    if (f.maxPrice) params.set("maxPrice", f.maxPrice.replace(/,/g, ""));
    if (keyword)    params.set("keyword", keyword);
    return params.toString();
  }

  // Core fetch function — takes keyword directly as argument
  // This fixes the search bug where setKeyword + fetchListings()
  // ran back to back and React hadn't flushed the keyword state yet
  async function fetchListings(keyword = "", isLoadMore = false, currentPage = 1) {
    if (!isLoadMore) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageNum = isLoadMore ? currentPage + 1 : 1;
      const res = await fetch(`/api/properties/feed?${buildQuery(pageNum, keyword)}`);
      const data = await res.json();

      if (res.ok) {
        if (isLoadMore) {
          setListings((prev) => [...prev, ...(data.listings ?? [])]);
          setPage(pageNum);
        } else {
          setListings(data.listings ?? []);
          setPage(1);
        }
        setHasMore(data.hasMore ?? false);
        setHasSearched(true);
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Search button / Enter key — passes keyword directly to fetchListings
  // No state update race condition
  function handleSearch() {
    fetchListings(searchInput.trim());
  }

  // Select filter changes — refetch with current search input if already searched
  useEffect(() => {
    if (hasSearched) {
      fetchListings(searchInput.trim());
    }
  }, [state, lga, type, purpose]);

  // Debounced price changes — refetch only after user stops typing
  useEffect(() => {
    if (hasSearched) {
      fetchListings(searchInput.trim());
    }
  }, [minPrice, maxPrice]);

  function clearFilters() {
    setState("Akwa Ibom");
    setLga("");
    setType("");
    setPurpose("");
    setMinPriceRaw("");
    setMaxPriceRaw("");
    setMinPrice("");
    setMaxPrice("");
    setSearchInput("");
    setHasSearched(false);
    setListings([]);
    setHasMore(false);
    setPage(1);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ── STICKY SEARCH + FILTER BAR ── */}
      <div className="sticky top-0 z-30 px-4 py-3 space-y-3"
        style={{ backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>

        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <circle cx="11" cy="11" r="8" stroke="var(--color-text-muted)" strokeWidth="1.8" />
              <path d="M21 21l-4.35-4.35" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by keyword, area..."
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: "var(--color-text)" }}
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); if (hasSearched) fetchListings(""); }}
                style={{ color: "var(--color-text-muted)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <button onClick={handleSearch}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
            Search
          </button>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: filtersOpen ? "var(--color-primary)" : "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="6" x2="20" y2="6"
                stroke={filtersOpen ? "white" : "var(--color-text-secondary)"}
                strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8" y1="12" x2="20" y2="12"
                stroke={filtersOpen ? "white" : "var(--color-text-secondary)"}
                strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="18" x2="20" y2="18"
                stroke={filtersOpen ? "white" : "var(--color-text-secondary)"}
                strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ backgroundColor: "#E53935", color: "#fff", fontSize: "9px" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1"
                  style={{ color: "var(--color-text-muted)" }}>State</label>
                <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }}
                  className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
                  {STATE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1"
                  style={{ color: "var(--color-text-muted)" }}>LGA</label>
                <select value={lga} onChange={(e) => setLga(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
                  <option value="">All LGAs</option>
                  {lgaOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1"
                  style={{ color: "var(--color-text-muted)" }}>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1"
                  style={{ color: "var(--color-text-muted)" }}>Purpose</label>
                <select value={purpose} onChange={(e) => setPurpose(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
                  <option value="">Rent or Sale</option>
                  <option value="rent">For Rent</option>
                  <option value="sale">For Sale</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1"
                style={{ color: "var(--color-text-muted)" }}>
                Price range (₦) — updates after you stop typing
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" inputMode="numeric" value={minPriceRaw}
                  onChange={(e) => setMinPriceRaw(e.target.value)}
                  placeholder="Min e.g. 100000"
                  className="text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }} />
                <input type="text" inputMode="numeric" value={maxPriceRaw}
                  onChange={(e) => setMaxPriceRaw(e.target.value)}
                  placeholder="Max e.g. 300000"
                  className="text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }} />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="w-full py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                Clear all filters
              </button>
            )}
          </div>
        )}

        {hasSearched && (
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {loading ? "Searching..." : `${listings.length} propert${listings.length === 1 ? "y" : "ies"} found`}
            </p>
            {searchInput && (
              <p className="text-xs" style={{ color: "var(--color-primary)" }}>
                Results for "{searchInput}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── LISTINGS ── */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-24">

        {!hasSearched && !loading && (
          <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: "#E8F5E9" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22"
                  stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-base font-semibold mb-2"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              Find your corper home
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              Search by keyword or browse all verified properties in your area.
            </p>
            <button onClick={() => fetchListings("")}
              className="px-8 py-3 rounded-2xl font-semibold text-sm"
              style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
              Show all properties in Akwa Ibom
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && hasSearched && (
          listings.length === 0 ? (
            <div className="rounded-2xl p-10 flex flex-col items-center text-center mt-4"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#E8F5E9" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="#2E7D32" strokeWidth="1.8" />
                  <path d="M21 21l-4.35-4.35" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                No properties found
              </p>
              <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
                {searchInput
                  ? `No results for "${searchInput}". Try different keywords.`
                  : activeFilterCount > 0
                  ? "No listings match your filters. Try adjusting them."
                  : `No listings available in ${state} right now.`}
              </p>
              {(activeFilterCount > 0 || searchInput) && (
                <button onClick={clearFilters}
                  className="text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ backgroundColor: "var(--color-light)", color: "var(--color-primary)" }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {listings.map((l) => (
                <PropertyCard
                  key={l.id}
                  listing={l}
                  isLoggedIn={isLoggedIn}
                />
              ))}

              {hasMore && (
                loadingMore ? (
                  <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : (
                  <button onClick={() => fetchListings(searchInput.trim(), true, page)}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                    style={{
                      backgroundColor: "var(--color-card)",
                      border: "1.5px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}>
                    Load more properties
                  </button>
                )
              )}

              {!hasMore && listings.length > 0 && (
                <p className="text-xs text-center pb-4"
                  style={{ color: "var(--color-text-muted)" }}>
                  You've seen all available properties
                </p>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}