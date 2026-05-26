"use client";

import { useState, useCallback } from "react";
import PropertyCard, { type PropertyCardData } from "@/components/property-card";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Props = {
  userName: string;
  initialListings: PropertyCardData[];
  totalCount: number;
  pageSize: number;
  watchlistedIds: string[];
};

type PurposeFilter = "all" | "rent" | "sale";

// ─── SKELETON CARD ───────────────────────────────────────────────────────────
// Shown while "Load more" is fetching next page

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Image placeholder */}
      <div
        className="w-full"
        style={{ height: "200px", backgroundColor: "#E8F5E9" }}
      />
      {/* Text placeholders */}
      <div className="px-4 pt-3 pb-4 space-y-2">
        <div
          className="h-4 rounded-lg w-3/4"
          style={{ backgroundColor: "#E8F5E9" }}
        />
        <div
          className="h-3 rounded-lg w-1/2"
          style={{ backgroundColor: "#E8F5E9" }}
        />
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 rounded-lg w-16"
              style={{ backgroundColor: "#E8F5E9" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function HomeClient({
  userName,
  initialListings,
  totalCount,
  pageSize,
  watchlistedIds,
}: Props) {
  const [listings, setListings] = useState<PropertyCardData[]>(initialListings);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(
    new Set(watchlistedIds)
  );
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>("all");
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  // First name only for the greeting — "Welcome, Chidi" not "Welcome, Chidi Okeke"
  const firstName = userName?.split(" ")[0] ?? "Corper";

  // Total pages based on server count
  const hasMore = listings.length < totalCount;

  // Filter listings by purpose on the client — no extra API call needed
  // since we already have the data
  const filteredListings = listings.filter((l) => {
    if (purposeFilter === "all") return true;
    return l.listingPurpose === purposeFilter;
  });

  // Called by PropertyCard after a successful watchlist toggle
  const handleWatchlistChange = useCallback(
    (listingId: string, watching: boolean) => {
      setWatchedIds((prev) => {
        const next = new Set(prev);
        if (watching) {
          next.add(listingId);
        } else {
          next.delete(listingId);
        }
        return next;
      });
    },
    []
  );

  // Load next page from /api/properties/feed
  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/properties/feed?page=${nextPage}&state=Akwa Ibom`
      );
      const data = await res.json();

      if (res.ok && data.listings?.length > 0) {
        setListings((prev) => [...prev, ...data.listings]);
        setPage(nextPage);
      }
    } catch {
      // Silent fail — user can tap again
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">

        {/* ── WELCOME BANNER ── */}
        <div
          className="rounded-2xl px-4 py-4"
          style={{
            background: "linear-gradient(135deg, #1B2E1B 0%, #2E7D32 100%)",
          }}
        >
          <p
            className="text-xs mb-0.5"
            style={{ color: "#7A9A7A", letterSpacing: "0.5px" }}
          >
            FIND YOUR HOME
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: "#E8F5E9", fontFamily: "var(--font-heading)" }}
          >
            Welcome, {firstName} 👋
          </p>
          <p className="text-xs mt-1" style={{ color: "#A5C8A5" }}>
            Verified properties in Akwa Ibom — inspect before you pay rent.
          </p>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="flex items-center gap-2">
          {(["all", "rent", "sale"] as PurposeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setPurposeFilter(f)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                backgroundColor:
                  purposeFilter === f
                    ? "var(--color-primary)"
                    : "var(--color-card)",
                color:
                  purposeFilter === f ? "#fff" : "var(--color-text-secondary)",
                border:
                  purposeFilter === f
                    ? "1.5px solid var(--color-primary)"
                    : "1.5px solid var(--color-border)",
              }}
            >
              {f === "all" ? "All" : f === "rent" ? "For Rent" : "For Sale"}
            </button>
          ))}

          {/* Listing count */}
          <p
            className="text-xs ml-auto"
            style={{ color: "var(--color-text-muted)" }}
          >
            {filteredListings.length} propert{filteredListings.length === 1 ? "y" : "ies"}
          </p>
        </div>

        {/* ── LISTINGS ── */}
        {filteredListings.length === 0 ? (
          // Empty state
          <div
            className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "#E8F5E9" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  stroke="#2E7D32"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="9 22 9 12 15 12 15 22"
                  stroke="#2E7D32"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p
              className="text-sm font-semibold mb-1"
              style={{
                color: "var(--color-text)",
                fontFamily: "var(--font-heading)",
              }}
            >
              No properties found
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {purposeFilter !== "all"
                ? `No ${purposeFilter === "rent" ? "rental" : "sale"} listings available right now. Try "All".`
                : "No listings available in Akwa Ibom right now. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((l) => (
              <PropertyCard
                key={l.id}
                listing={l}
                isWatchlisted={watchedIds.has(l.id)}
                onWatchlistChange={handleWatchlistChange}
              />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="pt-2 pb-4">
                {loadingMore ? (
                  // Skeleton cards while loading next page
                  <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : (
                  <button
                    onClick={loadMore}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                    style={{
                      backgroundColor: "var(--color-card)",
                      border: "1.5px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Load more properties
                  </button>
                )}
              </div>
            )}

            {/* End of results */}
            {!hasMore && filteredListings.length > 0 && (
              <p
                className="text-xs text-center pb-4"
                style={{ color: "var(--color-text-muted)" }}
              >
                You've seen all available properties
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}