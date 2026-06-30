"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PendingMatch {
  matchId:      string;
  requestId:    string;
  renterName:   string;
  agentName:    string;
  note:         string | null;
  createdAt:    string;
  minBudget:    number | null;
  maxBudget:    number | null;
  landmark:     string | null;
  listingId:    string;
  listingTitle: string;
  listingPrice: number;
  listingLga:   string;
  listingImage: string | null;
  withinBudget: boolean | null;
}

// Drop this component anywhere in your admin property-requests page —
// e.g. above the open-requests queue, since these need attention first.
export default function PendingMatchesReview() {
  const [matches, setMatches]   = useState<PendingMatch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { fetchPending(); }, []);

  async function fetchPending() {
    setLoading(true);
    try {
      const res  = await fetch("/api/property-requests/matches/pending");
      const data = await res.json();
      setMatches(data.pendingMatches ?? []);
    } catch {
      toast.error("Could not load pending matches.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(matchId: string, action: "approve" | "reject") {
    setActingOn(matchId);
    try {
      const res = await fetch(`/api/property-requests/matches/${matchId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: action === "reject" ? rejectReason.trim() || undefined : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }

      toast.success(action === "approve" ? "Match approved — renter notified." : "Match rejected — agent notified.");
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
      setRejectingId(null);
      setRejectReason("");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setActingOn(null);
    }
  }

  if (loading) {
    return <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: 16 }}>Loading pending matches…</p>;
  }

  if (matches.length === 0) return null; // nothing to show — no clutter when queue is empty

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-heading)" }}>
          Pending Match Review
        </p>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FFF8E1", color: "#92400E" }}>
          {matches.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {matches.map((m) => (
          <div key={m.matchId} style={{
            background: "var(--color-card)", border: "1.5px solid #FAC775",
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: "var(--color-light)", flexShrink: 0, overflow: "hidden" }}>
                {m.listingImage && <img src={m.listingImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)" }}>
                  {m.listingTitle}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                  ₦{m.listingPrice.toLocaleString()}/yr · {m.listingLga}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                  Agent: {m.agentName} → Renter: {m.renterName}
                </p>
              </div>
            </div>

            {/* Fit indicators — this is the whole point of the review step */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {m.withinBudget === null ? (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280" }}>
                  Renter didn't specify a budget
                </span>
              ) : m.withinBudget ? (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#E8F5E9", color: "#2E7D32" }}>
                  ✓ Within budget (₦{m.minBudget?.toLocaleString()} – ₦{m.maxBudget?.toLocaleString()})
                </span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "#FEF2F2", color: "#C62828" }}>
                  ⚠ Outside budget (renter wants ₦{m.minBudget?.toLocaleString()} – ₦{m.maxBudget?.toLocaleString()})
                </span>
              )}
              {m.landmark && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "var(--color-light)", color: "var(--color-primary)" }}>
                  Renter wants near: {m.landmark}
                </span>
              )}
            </div>

            {m.note && (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "var(--color-bg)", borderRadius: 10, padding: "8px 10px", margin: "0 0 12px", lineHeight: 1.5 }}>
                Agent's note: {m.note}
              </p>
            )}

            {rejectingId === m.matchId ? (
              <div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Why are you rejecting this? (shown to the agent)"
                  rows={2}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 12, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box", resize: "none", marginBottom: 8, fontFamily: "var(--font-body)" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setRejectingId(null); setRejectReason(""); }}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={() => handleReview(m.matchId, "reject")} disabled={actingOn === m.matchId}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "#E53935", border: "none", color: "#fff", cursor: "pointer" }}>
                    {actingOn === m.matchId ? "Rejecting…" : "Confirm Reject"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setRejectingId(m.matchId)} disabled={actingOn === m.matchId}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "#C62828", cursor: "pointer" }}>
                  Reject
                </button>
                <button onClick={() => handleReview(m.matchId, "approve")} disabled={actingOn === m.matchId}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "var(--color-primary)", border: "none", color: "#fff", cursor: "pointer" }}>
                  {actingOn === m.matchId ? "Approving…" : "Approve → Notify Renter"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}