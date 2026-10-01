// src/app/(main)/parkout/explore/explore-client.tsx
// Park-Out explore feed — incoming tenants browse available rooms.
// Shows only public info. Exact address is never exposed here.
// Filters: state, LGA, room type.
// Orders by moveOutDate ascending — most urgent first.

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";
import ListingsGrid from "./components/listings-grid";
import { type PublicListing } from "./components/listing-card";

const ROOM_TYPES = [
  { value: "",         label: "All types"     },
  { value: "self-con", label: "Self Contained" },
  { value: "mini-flat",label: "Mini Flat"      },
  { value: "room",     label: "Single Room"   },
  { value: "1-bed",    label: "1 Bedroom"     },
  { value: "2-bed",    label: "2 Bedroom"     },
];

export default function ExploreClient() {
  const router = useRouter();

  const [listings,    setListings]    = useState<PublicListing[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);

  // Filters
  const [state,     setState]     = useState("");
  const [lga,       setLga]       = useState("");
  const [roomType,  setRoomType]  = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const states   = STATE_NAMES;
  const lgaList  = state ? getLGAs(state) : [];

  const activeFilters = [state, lga, roomType].filter(Boolean).length;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
    border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)",
    color: "var(--color-text)", outline: "none", boxSizing: "border-box",
  };

  // ── Fetch feed ─────────────────────────────────────────────────────────
  const fetchListings = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum) });
      if (state)    params.set("state",    state);
      if (lga)      params.set("lga",      lga);
      if (roomType) params.set("roomType", roomType);

      const res  = await fetch(`/api/parkout/listings/feed?${params}`);
      const data = await res.json();
      if (!res.ok) return;

      if (replace) {
        setListings(data.listings ?? []);
        setPage(1);
      } else {
        setListings((prev) => {
          const ids = new Set(prev.map((l) => l.id));
          return [...prev, ...(data.listings ?? []).filter((l: PublicListing) => !ids.has(l.id))];
        });
        setPage(pageNum);
      }
      setHasMore(data.hasMore ?? false);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [state, lga, roomType]);

  // Initial load
  useEffect(() => {
    fetchListings(1, true);
  }, [fetchListings]);

  function clearFilters() {
    setState(""); setLga(""); setRoomType("");
  }

  return (
    <div style={{ backgroundColor: "var(--color-bg)", paddingBottom: 32 }}>

      {/* ── Sticky filter header ── */}
      <div style={{
        position: "sticky", top: 112, zIndex: 30,
        backgroundColor: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        padding: "10px 16px",
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

          {/* List my room CTA */}
          <button
            onClick={() => router.push("/parkout/new")}
            style={{
              flex: 1, padding: "10px 8px", borderRadius: 10,
              border: "none", backgroundColor: "var(--color-primary)",
              color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            🏠 List my room
          </button>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              position: "relative",
              padding: "10px 14px", borderRadius: 10,
              border: "1.5px solid var(--color-border)",
              backgroundColor: showFilters ? "var(--color-primary)" : "var(--color-card)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M7 12h10M11 18h2"
                stroke={showFilters ? "#fff" : "var(--color-text-secondary)"}
                strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: showFilters ? "#fff" : "var(--color-text-secondary)" }}>
              Filter
            </span>
            {activeFilters > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -6,
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: "#E53935", color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }} style={inputStyle}>
              <option value="">All states</option>
              {states.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={lga} onChange={(e) => setLga(e.target.value)} disabled={!state} style={{ ...inputStyle, opacity: state ? 1 : 0.5 }}>
              <option value="">All LGAs</option>
              {lgaList.map((l: string) => <option key={l} value={l}>{l}</option>)}
            </select>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ROOM_TYPES.map((t) => (
                <button key={t.value} type="button"
                  onClick={() => setRoomType(t.value)}
                  style={{
                    padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    border: "1.5px solid",
                    borderColor: roomType === t.value ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: roomType === t.value ? "var(--color-primary)" : "var(--color-bg)",
                    color: roomType === t.value ? "#fff" : "var(--color-text-muted)",
                    cursor: "pointer",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {activeFilters > 0 && (
              <button onClick={clearFilters}
                style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Result count */}
        {!loading && (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
            {listings.length} listing{listings.length !== 1 ? "s" : ""} available
            {activeFilters > 0 ? " · filtered" : " · ordered by urgency"}
          </p>
        )}
      </div>

      {/* ── Listings ── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 0" }}>
        <ListingsGrid
          listings={listings}
          loading={loading}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => fetchListings(page + 1, false)}
        />
      </div>
    </div>
  );
}