"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ListingOption {
  id:     string;
  title:  string;
  price:  number;
  lga:    string;
  images: string[] | null;
}

interface PropertyRequestSummary {
  id:        string;
  type:      string;
  lga:       string;
  state:     string;
  minBudget?: number | null;
  maxBudget?: number | null;
  landmark?:  string | null;
}

type Props = {
  request:  PropertyRequestSummary;
  onClose:  () => void;
  onMatched: () => void;
};

export default function MatchSelectionSheet({ request, onClose, onMatched }: Props) {
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lga: request.lga,
        state: request.state,
        type: request.type,
        page: "1",
      });
      const res  = await fetch(`/api/properties/feed?${params.toString()}`);
      const data = await res.json();
      setListings(data.listings ?? []);
    } catch {
      toast.error("Could not load listings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/property-requests/${request.id}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: selectedId, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not match this listing.");
        setSubmitting(false);
        return;
      }
      // Match route returns status: "pending" for agents, "approved" for admin
      toast.success(
        data.status === "pending"
          ? "Submitted for review — admin will confirm before the renter sees it."
          : "Matched! Renter has been notified."
      );
      onMatched();
    } catch {
      toast.error("Network error. Try again.");
      setSubmitting(false);
    }
  }

  const hasBudget = !!(request.minBudget && request.maxBudget);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: "var(--color-card)", borderRadius: "22px 22px 0 0",
        maxWidth: 480, margin: "0 auto", width: "100%",
        maxHeight: "80dvh", display: "flex", flexDirection: "column",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)" }} />
        </div>

        <div style={{ padding: "8px 20px 12px", borderBottom: "1px solid var(--color-border)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "var(--color-header)", margin: "0 0 2px" }}>
            Find a match
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
            Showing approved listings only · admin reviews before the renter sees it
          </p>
          {(hasBudget || request.landmark) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {hasBudget && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "var(--color-light)", color: "var(--color-primary)" }}>
                  Budget: ₦{request.minBudget!.toLocaleString()} – ₦{request.maxBudget!.toLocaleString()}
                </span>
              )}
              {request.landmark && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "var(--color-light)", color: "var(--color-primary)" }}>
                  Near: {request.landmark}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {loading && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", padding: 20 }}>Loading…</p>
          )}

          {!loading && listings.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", padding: 20 }}>
              No approved listings match this LGA + type right now.
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {listings.map((l) => {
              const isSelected = selectedId === l.id;
              // Fit check — shown right on the card so the agent can see
              // before picking, not just after, whether this genuinely
              // fits the renter's stated budget.
              const withinBudget = hasBudget
                ? l.price >= request.minBudget! && l.price <= request.maxBudget!
                : null;

              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  style={{
                    display: "flex", flexDirection: "column", gap: 6, padding: 10,
                    borderRadius: 12, textAlign: "left", cursor: "pointer",
                    border: isSelected ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                    backgroundColor: isSelected ? "var(--color-light)" : "var(--color-bg)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "var(--color-card)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {l.images?.[0] ? (
                        <img src={l.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.4" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.title}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
                        ₦{l.price.toLocaleString()}/yr · {l.lga}
                      </p>
                    </div>
                    {isSelected && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {withinBudget !== null && (
                    <span style={{
                      alignSelf: "flex-start", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: withinBudget ? "#E8F5E9" : "#FEF2F2",
                      color: withinBudget ? "#2E7D32" : "#C62828",
                    }}>
                      {withinBudget ? "✓ Within renter's budget" : "⚠ Outside renter's budget"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedId && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
                Note for renter (optional — e.g. anything missing from what they asked for)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. No prepaid meter, but everything else matches"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 13, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box", resize: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || submitting}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              backgroundColor: !selectedId || submitting ? "var(--color-border)" : "var(--color-primary)",
              color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14,
              cursor: !selectedId || submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : "Submit Match"}
          </button>
        </div>
      </div>
    </div>
  );
}