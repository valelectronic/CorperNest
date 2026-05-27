// src/app/(main)/watchlist/watchlist-client.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import PropertyCard, { type PropertyCardData } from "@/components/property-card";

interface Props {
  listings: PropertyCardData[];
}

export default function WatchlistClient({ listings: initial }: Props) {
  const [items, setItems] = useState<PropertyCardData[]>(initial);

  // Called by PropertyCard after a successful toggle
  // Since this page only shows saved items, any toggle here = removal
  const handleWatchlistChange = useCallback(
    (listingId: string, watching: boolean) => {
      if (!watching) {
        setItems((prev) => prev.filter((l) => l.id !== listingId));
        toast("Removed from watchlist", { duration: 2000 });
      }
    },
    []
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        paddingBottom: 88,
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          padding: "20px 16px 14px",
          background: "var(--color-card)",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--color-header)",
              margin: 0,
            }}
          >
            Saved Properties
          </h1>
          {items.length > 0 && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: "var(--color-light)",
                color: "var(--color-primary)",
              }}
            >
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "var(--color-text-muted)",
            }}
          >
            Tap the heart on any card to remove it
          </p>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "16px 16px 0" }}>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map((l) => (
              <PropertyCard
                key={l.id}
                listing={l}
                isLoggedIn
                isWatchlisted
                onWatchlistChange={handleWatchlistChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 72,
        paddingBottom: 32,
        textAlign: "center",
        gap: 0,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--color-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
            stroke="var(--color-primary)"
            strokeWidth="1.6"
            fill="none"
          />
        </svg>
      </div>

      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--color-header)",
          margin: "0 0 8px",
        }}
      >
        No saved properties yet
      </p>
      <p
        style={{
          fontSize: 14,
          color: "var(--color-text-muted)",
          margin: "0 0 28px",
          maxWidth: 260,
          lineHeight: 1.55,
        }}
      >
        Tap the heart on any property to save it here and revisit later.
      </p>

      <Link
        href="/home"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "13px 28px",
          background: "var(--color-primary)",
          color: "#fff",
          borderRadius: 14,
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
            fill="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        Browse Properties
      </Link>
    </div>
  );
}