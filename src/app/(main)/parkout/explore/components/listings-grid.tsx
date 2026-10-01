// src/app/(main)/parkout/explore/components/listings-grid.tsx
// Renders the grid of listing cards, skeleton loaders and empty state.

"use client";

import ListingCard, { type PublicListing } from "./listing-card";
import { useRouter } from "next/navigation";

type Props = {
  listings:   PublicListing[];
  loading:    boolean;
  hasMore:    boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <div style={{ height: 190, backgroundColor: "var(--color-light)" }} className="animate-pulse" />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ height: 10, borderRadius: 6, backgroundColor: "var(--color-light)", marginBottom: 8, width: "50%" }} className="animate-pulse" />
        <div style={{ height: 14, borderRadius: 6, backgroundColor: "var(--color-light)", marginBottom: 8, width: "80%" }} className="animate-pulse" />
        <div style={{ height: 12, borderRadius: 6, backgroundColor: "var(--color-light)", marginBottom: 12, width: "60%" }} className="animate-pulse" />
        <div style={{ height: 38, borderRadius: 10, backgroundColor: "var(--color-light)" }} className="animate-pulse" />
      </div>
    </div>
  );
}

export default function ListingsGrid({ listings, loading, hasMore, loadingMore, onLoadMore }: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div style={{
        borderRadius: 16, padding: "48px 24px",
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px", fontFamily: "var(--font-heading)" }}>
          No listings yet
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
          No active Park-Out listings match your filters.
          Try adjusting your search or check back soon.
        </p>
        <button
          onClick={() => router.push("/parkout/new")}
          style={{
            padding: "12px 20px", borderRadius: 12,
            border: "none", backgroundColor: "var(--color-primary)",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          List your room instead →
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>

      {hasMore && (
        <div style={{ marginTop: 16 }}>
          {loadingMore
            ? <SkeletonCard />
            : (
              <button
                onClick={onLoadMore}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-text-secondary)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Load more listings
              </button>
            )
          }
        </div>
      )}

      {!hasMore && listings.length > 0 && (
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: "16px 0 0" }}>
          All available listings shown
        </p>
      )}
    </div>
  );
}