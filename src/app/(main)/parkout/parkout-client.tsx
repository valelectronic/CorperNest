// src/app/(main)/parkout/parkout-client.tsx
// Park-Out & Earn main page.
// Shows hero + stats then immediately loads available listings.
// No extra navigation needed — land and see rooms.
// Listings ordered by moveOutDate ascending (most urgent first).

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ListingCard, { type PublicListing } from "./explore/components/listing-card";

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <div style={{ height: 190, backgroundColor: "var(--color-light)" }} className="animate-pulse" />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ height: 10, borderRadius: 6, backgroundColor: "var(--color-light)", marginBottom: 8, width: "50%" }} className="animate-pulse" />
        <div style={{ height: 14, borderRadius: 6, backgroundColor: "var(--color-light)", marginBottom: 8, width: "80%" }} className="animate-pulse" />
        <div style={{ height: 38, borderRadius: 10, backgroundColor: "var(--color-light)", marginTop: 12 }} className="animate-pulse" />
      </div>
    </div>
  );
}

export default function ParkOutClient() {
  const router = useRouter();

  const [listings,    setListings]    = useState<PublicListing[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Fetch listings on mount ────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/parkout/listings/feed?page=1")
      .then((r) => r.json())
      .then((data) => {
        setListings(data.listings ?? []);
        setHasMore(data.hasMore ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res  = await fetch(`/api/parkout/listings/feed?page=${nextPage}`);
      const data = await res.json();
      setListings((prev) => {
        const ids = new Set(prev.map((l) => l.id));
        return [...prev, ...(data.listings ?? []).filter((l: PublicListing) => !ids.has(l.id))];
      });
      setPage(nextPage);
      setHasMore(data.hasMore ?? false);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  }

  return (
    <div style={{ backgroundColor: "var(--color-bg)", paddingBottom: 40 }}>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #43A047 100%)",
        padding: "24px 20px 20px",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Park-Out & Earn
        </p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 8px", lineHeight: 1.2 }}>
          Find your next room or earn from your move-out
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "0 0 16px", lineHeight: 1.6 }}>
          Verified rooms from outgoing tenants. Pay ₦3,000 to book an inspection — no agent stress.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/parkout/new")}
            style={{
              flex: 1, padding: "12px 8px", borderRadius: 12,
              border: "none", backgroundColor: "#fff",
              fontSize: 12, fontWeight: 700, color: "#1B5E20", cursor: "pointer",
            }}
          >
            🏠 List my room
          </button>
          <button
            onClick={() => router.push("/parkout/ambassador/apply")}
            style={{
              flex: 1, padding: "12px 8px", borderRadius: 12,
              border: "1.5px solid rgba(255,255,255,0.5)",
              backgroundColor: "transparent",
              fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer",
            }}
          >
            💼 Become Ambassador
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
        <div style={{
          marginTop: 12,
          borderRadius: 14, padding: "14px 16px",
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
          textAlign: "center",
        }}>
          {[
            { value: "₦9k+",  label: "Min earn"     },
            { value: "60%",   label: "Your share"   },
            { value: "₦3k",   label: "Inspect fee"  },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 2px" }}>
                {s.value}
              </p>
              <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── AVAILABLE LISTINGS ── */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0, fontFamily: "var(--font-heading)" }}>
              Available rooms
            </p>
            {!loading && (
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                {listings.length} listing{listings.length !== 1 ? "s" : ""} · most urgent first
              </p>
            )}
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Listings */}
          {!loading && listings.length === 0 && (
            <div style={{
              borderRadius: 16, padding: "40px 24px",
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>
                No listings yet
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Be the first to list your room and earn when the next tenant moves in.
              </p>
              <button
                onClick={() => router.push("/parkout/new")}
                style={{
                  padding: "12px 20px", borderRadius: 12,
                  border: "none", backgroundColor: "var(--color-primary)",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                List my room →
              </button>
            </div>
          )}

          {!loading && listings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div style={{ marginTop: 16 }}>
              {loadingMore
                ? <SkeletonCard />
                : (
                  <button onClick={loadMore}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 14,
                      border: "1.5px solid var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      color: "var(--color-text-secondary)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>
                    Load more rooms
                  </button>
                )
              }
            </div>
          )}

          {!hasMore && !loading && listings.length > 0 && (
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: "16px 0 0" }}>
              All available rooms shown
            </p>
          )}
        </div>

               {/* ── HOW IT WORKS LINK ── */}
        <button
          onClick={() => router.push("/parkout/how-it-works")}
          style={{
            marginTop: 20, width: "100%", padding: "14px 16px",
            borderRadius: 14, border: "1.5px solid var(--color-border)",
            backgroundColor: "var(--color-card)", cursor: "pointer",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px" }}>
                How Park-Out &amp; Earn works
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                Steps, earnings, commissions explained
              </p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* ── BOTTOM CTA ── */}
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => router.push("/parkout/new")}
            style={{
              width: "100%", padding: "15px", borderRadius: 14,
              border: "none", backgroundColor: "var(--color-primary)",
              color: "#fff", fontFamily: "var(--font-heading)",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              marginBottom: 10,
            }}
          >
            🏠 List my room and start earning
          </button>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: 0 }}>
            Free to list · Commission paid to your bank via Paystack
          </p>
        </div>
      </div>
    </div>
  );
}