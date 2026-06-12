"use client";

import Link from "next/link";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AgentListing = {
  id:             string;
  title:          string;
  address:        string;
  lga:            string;
  price:          number;
  type:           string;
  status:         string;
  listingPurpose: string;
  images:         string[];
};

type Review = {
  id:           string;
  rating:       number;
  comment:      string | null;
  createdAt:    string;
  reviewerName: string;
};

type Props = {
  agent: {
    id:            string;
    name:          string;
    agentVerified: boolean;
    state:         string | null;
    lga:           string | null;
    createdAt:     string;
  };
  listings:       AgentListing[];
  avgRating:      number;
  totalReviews:   number;
  completedCount: number;
  reviews:        Review[];
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={rating >= s ? "#F59E0B" : "none"}
            stroke={rating >= s ? "#F59E0B" : "var(--color-border)"}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function AgentProfileClient({
  agent, listings, avgRating, totalReviews, completedCount, reviews,
}: Props) {
  const initial      = agent.name.charAt(0).toUpperCase();
  const roundedRating = Math.round(avgRating * 10) / 10;
  const memberSince  = formatDate(agent.createdAt);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)" }}>

      {/* Header */}
      <div style={{ background: "var(--color-card)", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/properties" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: 0 }}>
          Agent Profile
        </p>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Profile card */}
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: 18, flexShrink: 0,
              background: "var(--color-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26, color: "#E8F5E9",
            }}>
              {initial}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 18, color: "var(--color-header)", margin: 0 }}>
                  {agent.name}
                </p>
                {agent.agentVerified && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#E8F5E9", color: "#2E7D32", padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>
                    ✓ VERIFIED
                  </span>
                )}
              </div>

              {(agent.lga || agent.state) && (
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 4px" }}>
                  📍 {[agent.lga, agent.state].filter(Boolean).join(", ")}
                </p>
              )}
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                Member since {memberSince}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--color-border)", borderRadius: 14, overflow: "hidden" }}>
            {[
              { value: listings.length.toString(),    label: "Live listings" },
              { value: completedCount.toString(),      label: "Inspections" },
              { value: totalReviews > 0 ? `${roundedRating}★` : "—", label: `${totalReviews} review${totalReviews !== 1 ? "s" : ""}` },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--color-card)", padding: "14px 10px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: "var(--color-header)", margin: "0 0 2px", lineHeight: 1 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live listings */}
        {listings.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
              Available Properties · {listings.length}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {listings.map((l) => (
                <Link key={l.id} href={`/properties/${l.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden", display: "flex", gap: 12, padding: 12 }}>
                    {/* Thumb */}
                    <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--color-light)" }}>
                      {l.images[0] ? (
                        <img src={l.images[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="var(--color-text-muted)" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.title}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 6px" }}>
                        {l.lga}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, color: "var(--color-primary)", margin: 0 }}>
                          ₦{l.price.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--color-text-muted)" }}>{l.listingPurpose === "rent" ? "/yr" : ""}</span>
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#EAF3DE", color: "#27500A" }}>
                          Available
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {listings.length === 0 && (
          <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "32px 20px", textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No listings available right now</p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Reviews · {totalReviews}
            </p>
            {totalReviews > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <StarDisplay rating={Math.round(avgRating)} size={13} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>{roundedRating}</span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 4px", fontWeight: 600 }}>No reviews yet</p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>Be the first to book and leave a review</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", margin: "0 0 4px" }}>
                        {r.reviewerName}
                      </p>
                      <StarDisplay rating={r.rating} size={13} />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, flexShrink: 0 }}>
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}