// src/app/(market)/marketplace/my-listings/my-listings-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type MyListing = {
  id:            string;
  title:         string;
  category:      string;
  condition:     string;
  price:         number;
  images:        string[];
  status:        string;
  listingType:   string;
  delivery:      string;
  createdAt:     Date | string;
  expiresAt:     Date | string | null;
  approvedAt:    Date | string | null;
  earned:        number;
  availRequestId: string | null; // availability request ID for reserving listings
};

type Props = {
  listings:      MyListing[];
  totalEarned:   number;
  completedSales: number;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  pending:   { label: "Awaiting approval", bg: "#FFF8E1", color: "#92400E", emoji: "⏳" },
  active:    { label: "Active",            bg: "#E8F5E9", color: "#2E7D32", emoji: "✅" },
  reserving: { label: "Being reserved",   bg: "#EEF2FF", color: "#4338CA", emoji: "🔒" },
  reserved:  { label: "Payment in escrow",bg: "#EEF2FF", color: "#4338CA", emoji: "💳" },
  sold:      { label: "Sold",             bg: "#F0FDF4", color: "#15803D", emoji: "✓"  },
  flagged:   { label: "Flagged",          bg: "#FEF2F2", color: "#C62828", emoji: "⚠️" },
  expired:   { label: "Expired",          bg: "#F3F4F6", color: "#6B7280", emoji: "⌛" },
};

function Spinner() {
  return <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.15)", borderTopColor: "#C62828", animation: "spin 0.8s linear infinite", display: "inline-block" }} />;
}

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days  = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function MyListingsClient({ listings, totalEarned, completedSales }: Props) {
  const router   = useRouter();
  const [delisting,      setDelisting]      = useState<string | null>(null);
  const [confirmDelist,  setConfirmDelist]  = useState<string | null>(null);
  const [cancelling,     setCancelling]     = useState<string | null>(null);
  const [markingSold,    setMarkingSold]    = useState<string | null>(null);
  const [relisting,      setRelisting]      = useState<string | null>(null);

  async function handleMarkSold(id: string) {
    setMarkingSold(id);
    try {
      const res  = await fetch(`/api/marketplace/listings/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-sold" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not update."); return; }
      toast.success("Listing marked as sold.");
      router.refresh();
    } catch { toast.error("Network error. Try again."); }
    finally   { setMarkingSold(null); }
  }

  async function handleRelist(id: string) {
    setRelisting(id);
    try {
      const res  = await fetch(`/api/marketplace/listings/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "relist" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not relist."); return; }
      toast.success("Listing resubmitted — pending admin approval.");
      router.refresh();
    } catch { toast.error("Network error. Try again."); }
    finally   { setRelisting(null); }
  }

  async function handleCancelReservation(listingId: string, availRequestId: string | null) {
    if (!availRequestId) { toast.error("No active reservation found."); return; }
    setCancelling(listingId);
    try {
      const patch = await fetch("/api/marketplace/availability", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: availRequestId, action: "cancel" }),
      });
      const patchData = await patch.json();
      if (!patch.ok) { toast.error(patchData.error ?? "Could not cancel."); return; }
      toast.success("Reservation cancelled — listing is active again.");
      router.refresh();
    } catch { toast.error("Network error. Try again."); }
    finally   { setCancelling(null); }
  }

  async function handleDelist(id: string) {
    setDelisting(id);
    try {
      const res  = await fetch(`/api/marketplace/listings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not remove listing."); return; }
      toast.success("Listing removed.");
      setConfirmDelist(null);
      router.refresh();
    } catch { toast.error("Network error. Try again."); }
    finally   { setDelisting(null); }
  }

  const active  = listings.filter((l) => l.status === "active").length;
  const pending = listings.filter((l) => l.status === "pending").length;

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 56, zIndex: 30, padding: "12px 16px", backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>My Listings</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
              {active} active · {pending} pending approval
            </p>
          </div>
          <button onClick={() => router.push("/marketplace/new")}
            style={{ padding: "9px 16px", borderRadius: 12, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + New listing
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px" }}>

        {/* Stats row */}
        {completedSales > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <div style={{ padding: "14px", borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
                {completedSales}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>Completed sales</p>
            </div>
            <div style={{ padding: "14px", borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#15803D", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
                ₦{totalEarned.toLocaleString("en-NG")}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>Total earned</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {listings.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>No listings yet</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px" }}>List an item to start selling via escrow</p>
            <button onClick={() => router.push("/marketplace/new")}
              style={{ padding: "12px 24px", borderRadius: 12, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              List your first item
            </button>
          </div>
        )}

        {/* Listing cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {listings.map((l) => {
            const cfg = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.pending;
            return (
              <div key={l.id} style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
                {/* Main info */}
                <div style={{ display: "flex", gap: 12, padding: "14px", alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", backgroundColor: "var(--color-light)", flexShrink: 0 }}>
                    {l.images[0]
                      ? <img src={l.images[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.title}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 4px" }}>
                      {l.category} · {l.condition === "new" ? "✨ New" : "♻️ Used"} · {timeAgo(l.createdAt)}
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "var(--color-primary)", margin: 0, fontFamily: "var(--font-heading)" }}>
                      ₦{l.price.toLocaleString("en-NG")}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>

                {/* Status messages */}
                {l.status === "pending" && (
                  <div style={{ padding: "8px 14px", backgroundColor: "#FFF8E1", borderTop: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 11, color: "#92400E", margin: 0 }}>
                      Our team is reviewing your listing — usually approved within a few hours.
                    </p>
                  </div>
                )}
                {l.status === "reserving" && (
                  <div style={{ padding: "8px 14px", backgroundColor: "#EEF2FF", borderTop: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 11, color: "#4338CA", margin: "0 0 6px" }}>
                      A buyer is trying to purchase this item. Confirm if it is still available.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {l.availRequestId && (
                        <button onClick={() => router.push(`/marketplace/${l.id}/confirm-availability?request=${l.availRequestId}`)}
                          style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", backgroundColor: "#4338CA", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          ✅ Reply now
                        </button>
                      )}
                      <button onClick={() => handleCancelReservation(l.id, l.availRequestId)} disabled={cancelling === l.id}
                        style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {cancelling === l.id ? "Cancelling…" : "↩ Cancel reservation"}
                      </button>
                    </div>
                  </div>
                )}
                {l.status === "reserved" && (
                  <div style={{ padding: "8px 14px", backgroundColor: "#EEF2FF", borderTop: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 11, color: "#4338CA", margin: 0 }}>
                      Payment received — coordinate pickup with the buyer. You will be paid after they confirm receipt.
                    </p>
                  </div>
                )}
                {l.status === "sold" && l.earned > 0 && (
                  <div style={{ padding: "8px 14px", backgroundColor: "#F0FDF4", borderTop: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 11, color: "#15803D", margin: 0, fontWeight: 600 }}>
                      ✓ You earned ₦{l.earned.toLocaleString("en-NG")} from this sale.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: "1px solid var(--color-border)", flexWrap: "wrap" }}>
                  <button onClick={() => router.push(`/marketplace/${l.id}`)}
                    style={{ flex: 1, minWidth: 80, padding: "9px", borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer" }}>
                    View
                  </button>
                  {l.status === "active" && (
                    <button onClick={() => handleMarkSold(l.id)} disabled={markingSold === l.id}
                      style={{ flex: 1, minWidth: 80, padding: "9px", borderRadius: 10, border: "1px solid #A5D6A7", backgroundColor: "#E8F5E9", color: "#15803D", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {markingSold === l.id ? "…" : "✓ Mark sold"}
                    </button>
                  )}
                  {["expired", "flagged"].includes(l.status) && (
                    <button onClick={() => handleRelist(l.id)} disabled={relisting === l.id}
                      style={{ flex: 1, minWidth: 80, padding: "9px", borderRadius: 10, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {relisting === l.id ? "…" : "↻ Relist"}
                    </button>
                  )}
                  {["active", "pending", "expired", "flagged"].includes(l.status) && (
                    <button onClick={() => setConfirmDelist(l.id)}
                      style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", fontSize: 12, fontWeight: 600, color: "#C62828", cursor: "pointer" }}>
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delist confirmation modal */}
      {confirmDelist && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelist(null); }}>
          <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 8px" }}>
              Remove this listing?
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
              The listing and all its photos will be permanently deleted. This cannot be undone.
            </p>
            <button onClick={() => handleDelist(confirmDelist)} disabled={delisting === confirmDelist}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", backgroundColor: "#C62828", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              {delisting === confirmDelist ? <Spinner /> : "Yes, remove listing"}
            </button>
            <button onClick={() => setConfirmDelist(null)}
              style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}