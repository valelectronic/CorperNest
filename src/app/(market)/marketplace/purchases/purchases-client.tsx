// src/app/(market)/marketplace/purchases/purchases-client.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Purchase = {
  id:           string;
  listingId:    string;
  amount:       number;
  commission:   number;
  sellerPayout: number;
  status:       string;
  paystackRef:  string | null;
  paidAt:       Date | string | null;
  confirmedAt:  Date | string | null;
  releasedAt:   Date | string | null;
  createdAt:    Date | string;
  listingTitle:    string;
  listingImages:   string[];
  listingStatus:   string;
  listingLga:      string;
  listingState:    string;
  listingLandmark: string;
  // Waybill — from seller
  waybillDetails:  string | null;
  shippedAt:       Date | string | null;
};

type PendingRequest = {
  id:                  string;
  listingId:           string;
  agreedPrice:         number;
  status:              string;
  expiresAtMs:         number;
  checkoutExpiresAtMs: number | null;
  listingTitle:        string;
  listingImages:       string[];
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: "Awaiting payment", bg: "#FFF8E1", color: "#92400E" },
  escrow:   { label: "Order Processing",        bg: "#EEF2FF", color: "#4338CA" },
  buyer_confirmed: { label: "Delivery Confirmed", bg: "#E8F5E9", color: "#2E7D32" },
  released: { label: "Complete",         bg: "#E8F5E9", color: "#2E7D32" },
  disputed: { label: "Dispute raised",   bg: "#FEF2F2", color: "#C62828" },
  refunded: { label: "Refunded",         bg: "#F3F4F6", color: "#6B7280" },
};

function timeAgo(date: Date | string | null): string {
  if (!date) return "";
  const diff  = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (hours < 1)  return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function Spinner() {
  return (
    <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
  );
}

// ── STAR RATING COMPONENT ─────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 32, padding: 0, lineHeight: 1,
            color: star <= (hovered || value) ? "#F59E0B" : "#E5E7EB",
            transition: "color 0.1s",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── RATING MODAL ──────────────────────────────────────────────────────────────
function RatingModal({ transactionId, sellerName, onDone }: {
  transactionId: string;
  sellerName:    string;
  onDone:        () => void;
}) {
  const [stars,      setStars]      = useState(0);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (stars === 0) { toast.error("Please select a star rating."); return; }
    setSubmitting(true);
    try {
      await fetch("/api/marketplace/ratings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, stars, comment: comment.trim() || null }),
      });
      toast.success("Thank you for your rating!");
      onDone();
    } catch { onDone(); } // silent — never block the user
    finally   { setSubmitting(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onDone(); }}>
      <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />

        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--color-header)", textAlign: "center", margin: "0 0 4px" }}>
          Rate this seller
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", margin: "0 0 20px" }}>
          How was your experience?
        </p>

        <StarRating value={stars} onChange={setStars} />

        {stars > 0 && (
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-muted)", margin: "8px 0 16px" }}>
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][stars]}
          </p>
        )}

        <div style={{ marginBottom: 16, marginTop: stars > 0 ? 0 : 20 }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 200))}
            placeholder="Leave a comment (optional)"
            rows={3}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text)", resize: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{comment.length}/200</span>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting || stars === 0}
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", backgroundColor: stars === 0 ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: stars === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          {submitting ? <Spinner /> : "Submit Rating"}
        </button>
        <button onClick={onDone}
          style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
          Skip
        </button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PurchasesClient({
  purchases, pendingRequests,
}: {
  purchases:       Purchase[];
  pendingRequests: PendingRequest[];
}) {
  const router = useRouter();
  const [confirming,      setConfirming]      = useState<string | null>(null);
  const [disputing,       setDisputing]       = useState<string | null>(null);
  const [showConfirm,     setShowConfirm]     = useState<string | null>(null);
  const [showRating,      setShowRating]      = useState<string | null>(null); // transactionId
  const [countdowns,      setCountdowns]      = useState<Record<string, string>>({});

  useEffect(() => {
    if (!pendingRequests.length) return;
    const tick = setInterval(() => {
      const updated: Record<string, string> = {};
      let anyExpired = false;
      for (const r of pendingRequests) {
        const target    = r.status === "confirmed" ? r.checkoutExpiresAtMs : r.expiresAtMs;
        const remaining = Math.max(0, (target ?? r.expiresAtMs) - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        updated[r.id] = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        if (remaining === 0) anyExpired = true;
      }
      setCountdowns(updated);
      if (anyExpired) {
        clearInterval(tick);
        const expired = pendingRequests.find((r) => {
          const target = r.status === "confirmed" ? r.checkoutExpiresAtMs : r.expiresAtMs;
          return (target ?? r.expiresAtMs) <= Date.now();
        });
        if (expired) {
          fetch(`/api/marketplace/availability?listingId=${expired.listingId}`)
            .finally(() => router.refresh());
        }
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [pendingRequests, router]);

  async function handleItemReceived(txnId: string) {
    setConfirming(txnId);
    try {
      const res  = await fetch("/api/marketplace/purchases/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txnId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not confirm. Try again."); return; }
      toast.success("✅ Delivery confirmed! Order complete.");
      setShowConfirm(null);
      // Show rating prompt immediately after confirmation
      setShowRating(txnId);
      router.refresh();
    } catch { toast.error("Network error. Try again."); }
    finally   { setConfirming(null); }
  }

  async function handleDispute(txnId: string) {
    setDisputing(txnId);
    try {
      const res  = await fetch("/api/marketplace/purchases/dispute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txnId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not raise dispute. Try again."); return; }
      toast("🚨 Dispute raised — CorperNest admin will contact you within 24 hours.");
      router.refresh();
    } catch { toast.error("Network error. Try again."); }
    finally   { setDisputing(null); }
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 56, zIndex: 30, padding: "12px 16px", backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>My Purchases</p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
          Tap "Item Received" when you collect your item to complete your order
        </p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px" }}>

        {/* Pending reservations */}
        {pendingRequests.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
              Pending Reservations
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingRequests.map((r) => (
                <div key={r.id} style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: `1.5px solid ${r.status === "confirmed" ? "#86EFAC" : "var(--color-border)"}`, overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: 12, padding: "12px 14px", alignItems: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", backgroundColor: "var(--color-light)", flexShrink: 0 }}>
                      {r.listingImages[0]
                        ? <img src={r.listingImages[0]} alt={r.listingTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.listingTitle}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 4px", fontFamily: "var(--font-heading)" }}>
                        ₦{r.agreedPrice.toLocaleString("en-NG")}
                      </p>
                      {r.status === "pending" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: "#FFF8E1", color: "#92400E" }}>⏳ Waiting for seller</span>
                          <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 800, color: "#92400E" }}>{countdowns[r.id] ?? "45:00"}</span>
                        </div>
                      )}
                      {r.status === "confirmed" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: "#E8F5E9", color: "#15803D" }}>✅ Confirmed — pay now</span>
                          <span style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 800, color: "#15803D" }}>{countdowns[r.id] ?? "60:00"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: "0 14px 12px" }}>
                    {r.status === "pending" && (
                      <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
                        Seller has been notified. Nothing has left your account.
                      </p>
                    )}
                    {r.status === "confirmed" && (
                      <p style={{ fontSize: 11, color: "#15803D", margin: "0 0 8px", fontWeight: 600 }}>
                        Item confirmed available! Complete payment before the window closes.
                      </p>
                    )}
                    <button onClick={() => router.push(
                      r.status === "confirmed"
                        ? `/marketplace/${r.listingId}/checkout?availability=${r.id}`
                        : `/marketplace/${r.listingId}`
                    )}
                      style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", backgroundColor: r.status === "confirmed" ? "#15803D" : "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      {r.status === "confirmed" ? "🔒 Complete Payment Now" : "View listing"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchases */}
        {purchases.length === 0 && pendingRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>No purchases yet</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px" }}>Items you buy securely appear here</p>
            <button onClick={() => router.push("/marketplace")}
              style={{ padding: "12px 24px", borderRadius: 12, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {purchases.map((p) => {
              const config   = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
              const isEscrow = p.status === "escrow";

              return (
                <div key={p.id} style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden" }}>

                  {/* Listing info */}
                  <div style={{ display: "flex", gap: 12, padding: "14px", alignItems: "center", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", backgroundColor: "var(--color-light)", flexShrink: 0 }}>
                      {p.listingImages[0]
                        ? <img src={p.listingImages[0]} alt={p.listingTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📦</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.listingTitle}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 4px" }}>
                        📍 {p.listingLandmark}, {p.listingLga}
                      </p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary)", margin: 0, fontFamily: "var(--font-heading)" }}>
                        ₦{p.amount.toLocaleString("en-NG")}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, backgroundColor: config.bg, color: config.color, flexShrink: 0 }}>
                      {config.label}
                    </span>
                  </div>

                  {/* Waybill / tracking info */}
                  {isEscrow && p.waybillDetails && (
                    <div style={{ padding: "10px 14px", backgroundColor: "#EEF2FF", borderBottom: "1px solid var(--color-border)" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#4338CA", margin: "0 0 2px" }}>
                        📦 Item has been shipped
                      </p>
                      <p style={{ fontSize: 12, color: "#4338CA", margin: 0 }}>
                        {p.waybillDetails}
                      </p>
                    </div>
                  )}

                  {/* Order actions */}
                  {isEscrow && (
                    <div style={{ padding: "12px 14px" }}>
                      {!p.waybillDetails && (
                        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
                          Your order is protected. Once you collect the item, tap below to confirm delivery.
                        </p>
                      )}
                      {p.waybillDetails && (
                        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
                          When you receive the item, confirm below to complete your order.
                        </p>
                      )}
                      <button onClick={() => setShowConfirm(p.id)}
                        style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", backgroundColor: "#15803D", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8 }}>
                        ✅ Item Received
                      </button>
                      <button onClick={() => handleDispute(p.id)} disabled={disputing === p.id}
                        style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", color: "#C62828", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        {disputing === p.id ? "Raising dispute…" : "⚠️ Item not received / issue"}
                      </button>
                    </div>
                  )}

                  {/* Complete */}
                  {p.status === "released" && (
                    <div style={{ padding: "10px 14px", backgroundColor: "#F0FDF4" }}>
                      <p style={{ fontSize: 11, color: "#15803D", margin: 0, fontWeight: 600 }}>
                        ✓ Transaction complete · {timeAgo(p.releasedAt)}
                      </p>
                    </div>
                  )}

                  {/* Disputed */}
                  {p.status === "disputed" && (
                    <div style={{ padding: "10px 14px", backgroundColor: "#FEF2F2" }}>
                      <p style={{ fontSize: 11, color: "#C62828", margin: 0, fontWeight: 600 }}>
                        🚨 Dispute raised — CorperNest will contact you within 24 hours
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Received confirmation modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(null); }}>
          <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 8px" }}>
              Confirm you received the item
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
              Only confirm if you have physically collected the item and it matches the listing. Once confirmed, your order is marked complete and cannot be reversed.
            </p>
            <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "#FFF8E1", border: "1px solid #FAC775", marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "#92400E", margin: 0, fontWeight: 600 }}>
                ⚠️ If the item is not as described, tap Dispute instead — do not confirm.
              </p>
            </div>
            <button onClick={() => handleItemReceived(showConfirm)} disabled={confirming === showConfirm}
              style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", backgroundColor: "#15803D", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              {confirming === showConfirm ? <Spinner /> : "✅ Yes, I received the item"}
            </button>
            <button onClick={() => setShowConfirm(null)}
              style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rating modal — shown immediately after confirming receipt */}
      {showRating && (
        <RatingModal
          transactionId={showRating}
          sellerName="this seller"
          onDone={() => { setShowRating(null); router.refresh(); }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}