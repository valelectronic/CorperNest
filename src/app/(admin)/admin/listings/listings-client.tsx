"use client";

import { useState } from "react";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PendingListing = {
  id:              string;
  title:           string;
  description:     string;
  address:         string;
  landmark:        string | null; // ← ADD
  lga:             string;
  state:           string;
  price:           number;
  type:            string;
  listingPurpose:  string;
  status:          string;
  images:          string[] | null;
  amenities:       string[] | null;
  createdAt:       Date;
  agentId:         string;
  agentName:       string;
  agentEmail:      string;
  agentPhone:      string | null;
  possibleDuplicate?: boolean; // ← ADD
};

type RecentlyDeclined = {
  id:        string;
  title:     string;
  status:    string;
  updatedAt: Date;
  agentName: string;
};

type Props = {
  pending:          PendingListing[];
  recentlyDeclined: RecentlyDeclined[];
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatPrice(p: number) {
  return `₦${p.toLocaleString("en-NG")}`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function AdminListingsClient({ pending, recentlyDeclined }: Props) {
  const [items, setItems]                 = useState(pending);
  const [declined, setDeclined]           = useState(recentlyDeclined);
  const [processingId, setProcessingId]   = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<PendingListing | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [expandedId, setExpandedId]       = useState<string | null>(null);

  async function handleApprove(listingId: string) {
    setProcessingId(listingId);
    try {
      const res  = await fetch("/api/admin/listings/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to approve."); return; }
      setItems((prev) => prev.filter((l) => l.id !== listingId));
      toast.success("Listing approved and now live.");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeclineSubmit() {
    if (!declineTarget) return;
    if (declineReason.trim().length < 5) {
      toast.error("Please enter a reason (at least 5 characters).");
      return;
    }
    setProcessingId(declineTarget.id);
    try {
      const res  = await fetch("/api/admin/listings/decline", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: declineTarget.id, reason: declineReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to decline."); return; }
      const target = declineTarget;
      setItems((prev)    => prev.filter((l) => l.id !== target.id));
      setDeclined((prev) => [
        { id: target.id, title: target.title, status: "flagged", updatedAt: new Date(), agentName: target.agentName },
        ...prev.slice(0, 9),
      ]);
      setDeclineTarget(null);
      setDeclineReason("");
      toast.success("Listing declined. Agent notified.");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div style={{ padding: "24px 16px 64px", maxWidth: 800, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Listing Reviews
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          Approve or decline agent listings before they go public
        </p>
      </div>

      {/* Pending count */}
      {items.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFF8E1", border: "1px solid #FAC775", borderRadius: 12, padding: "12px 16px", marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="#B45309" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#92400E" }}>
            {items.length} listing{items.length !== 1 ? "s" : ""} awaiting review
            {items.filter((l) => l.possibleDuplicate).length > 0 && (
              <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 20, background: "#FEF3C7", color: "#B45309", fontSize: 11 }}>
                {items.filter((l) => l.possibleDuplicate).length} possible duplicate{items.filter((l) => l.possibleDuplicate).length > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Pending listings */}
      {items.length === 0 ? (
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "48px 24px", textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: "0 0 4px" }}>All caught up</p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No listings waiting for review</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
          {items.map((l) => {
            const isExpanded   = expandedId === l.id;
            const isProcessing = processingId === l.id;
            const coverImage   = l.images?.[0] ?? null;
            const isDuplicate  = l.possibleDuplicate === true;

            return (
              <div key={l.id} style={{
                background: "var(--color-card)", border: `1px solid ${isDuplicate ? "#FAC775" : "var(--color-border)"}`,
                borderRadius: 18, overflow: "hidden",
                opacity: isProcessing ? 0.6 : 1, transition: "opacity 0.2s",
              }}>
                {/* Top strip — yellow for duplicate, amber for normal */}
                <div style={{ height: 3, background: isDuplicate ? "#F59E0B" : "#F59E0B" }} />

                {/* ── POSSIBLE DUPLICATE WARNING ── */}
                {isDuplicate && (
                  <div style={{ background: "#FFF8E1", borderBottom: "1px solid #FAC775", padding: "10px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#B45309" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="M12 9v4M12 17h.01" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#92400E" }}>
                        ⚠️ Possible duplicate — verify before approving
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#B45309", lineHeight: 1.5 }}>
                        Another active listing exists near <strong>{l.landmark ?? l.address}</strong> in {l.lga} with the same property type. Call the agent to confirm this is a different unit.
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ padding: 16 }}>
                  {/* Main row */}
                  <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--color-light)" }}>
                      {coverImage ? (
                        <img src={coverImage} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="#7A9A7A" strokeWidth="1.4" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", lineHeight: 1.3 }}>
                          {l.title}
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#FFF8E1", color: "#92400E", flexShrink: 0, whiteSpace: "nowrap" }}>
                          Under Review
                        </span>
                      </div>

                      {/* Landmark shown prominently */}
                      {l.landmark && (
                        <p style={{ margin: "0 0 3px", fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>
                          📍 {l.landmark}
                        </p>
                      )}

                      <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--color-text-muted)" }}>
                        {l.address}, {l.lga}
                      </p>
                      <p style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-primary)" }}>
                        {formatPrice(l.price)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-muted)" }}>{l.listingPurpose === "rent" ? "/yr" : ""}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>
                        Submitted {formatDate(l.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Agent row */}
                  <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--color-border)", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Agent</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-header)" }}>{l.agentName}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--color-text-muted)" }}>{l.agentEmail}</p>
                      {l.agentPhone && (
                        <a href={`tel:${l.agentPhone}`} style={{ margin: 0, fontSize: 11, color: "var(--color-primary)", textDecoration: "none", display: "block", fontWeight: 600 }}>
                          📞 {l.agentPhone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : l.id)}
                    style={{ width: "100%", padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    {isExpanded ? "Hide details" : "View full details"}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "12px", border: "1px solid var(--color-border)", marginBottom: 10 }}>
                        <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Description</p>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text)", lineHeight: 1.6 }}>{l.description}</p>
                      </div>
                      {l.images && l.images.length > 0 && (
                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                          {l.images.map((img, i) => (
                            <img key={i} src={img} alt={`Photo ${i + 1}`}
                              style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "1px solid var(--color-border)" }} />
                          ))}
                        </div>
                      )}
                      {l.amenities && l.amenities.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {l.amenities.map((a) => (
                            <span key={a} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-light)", color: "var(--color-primary)", fontWeight: 600 }}>
                              {a.replace(/-/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setDeclineTarget(l)}
                      disabled={isProcessing}
                      style={{ flex: 1, padding: "13px", borderRadius: 14, fontSize: 13, fontWeight: 700, background: "#FEF2F2", border: "1px solid #FECACA", color: "#C62828", cursor: "pointer", fontFamily: "var(--font-heading)" }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApprove(l.id)}
                      disabled={isProcessing}
                      style={{ flex: 2, padding: "13px", borderRadius: 14, fontSize: 13, fontWeight: 700, background: "var(--color-primary)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-heading)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      {isProcessing ? (
                        <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                      ) : (
                        <>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Approve & Go Live
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recently declined */}
      {declined.length > 0 && (
        <div>
          <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-heading)" }}>
            Recently Declined
          </p>
          <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
            {declined.map((l, i) => (
              <div key={l.id} style={{ padding: "12px 16px", borderBottom: i < declined.length - 1 ? "1px solid var(--color-border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>{l.agentName} · {formatDate(l.updatedAt)}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#FFEBEE", color: "#C62828", flexShrink: 0 }}>
                  Declined
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decline modal backdrop */}
      {declineTarget && (
        <div onClick={() => { setDeclineTarget(null); setDeclineReason(""); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      )}

      {/* Decline bottom sheet */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        background: "var(--color-card)", borderRadius: "22px 22px 0 0",
        transform: declineTarget ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        maxWidth: 800, margin: "0 auto",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
        </div>
        <div style={{ padding: "0 16px 24px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--color-header)", margin: "0 0 4px" }}>
            Decline listing
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px" }}>
            {declineTarget?.title}
          </p>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Reason for declining *
          </label>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g. Images are blurry, please upload clear photos of each room"
            rows={4}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, border: "1.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", resize: "vertical", fontFamily: "var(--font-body)", boxSizing: "border-box", lineHeight: 1.5, outline: "none" }}
          />
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 20px" }}>
            This will be sent to the agent by in-app notification.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setDeclineTarget(null); setDeclineReason(""); }}
              style={{ flex: 1, padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleDeclineSubmit} disabled={processingId === declineTarget?.id}
              style={{ flex: 2, padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 700, background: "#C62828", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-heading)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {processingId === declineTarget?.id ? (
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              ) : "Send & Decline"}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}