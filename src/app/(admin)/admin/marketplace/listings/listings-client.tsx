// src/app/admin/marketplace/listings/listings-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Listing = {
  id:            string;
  title:         string;
  category:      string;
  condition:     string;
  price:         number;
  images:        string[];
  status:        string;
  listingType:   string;
  lga:           string;
  state:         string;
  sellerId:      string;
  sellerName:    string | null;
  sellerPhone:   string | null;
  createdAt:     Date | string;
  approvedAt:    Date | string | null;
  reportCount:   number;
  reportReasons: string[];
};

type Props = {
  pending:  Listing[];
  active:   Listing[];
  flagged:  Listing[];
  others:   Listing[];
  reported: Listing[];
};

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hrs < 1)  return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#FFF8E1", color: "#92400E", label: "⏳ Pending" },
  active:  { bg: "#E8F5E9", color: "#2E7D32", label: "✅ Active"  },
  flagged: { bg: "#FEF2F2", color: "#C62828", label: "🚩 Flagged" },
  expired: { bg: "#F3F4F6", color: "#6B7280", label: "⌛ Expired" },
  sold:    { bg: "#F0FDF4", color: "#15803D", label: "✓ Sold"    },
};

export default function AdminMarketListingsClient({ pending, active, flagged, others, reported }: Props) {
  const router = useRouter();
  const [acting,       setActing]       = useState<string | null>(null);
  const [rejectId,     setRejectId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteId,     setDeleteId]     = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "reject" | "pause" | "restore") {
    if (action === "reject") { setRejectId(id); setRejectReason(""); return; }
    setActing(id);
    try {
      const res = await fetch(`/api/admin/marketplace/listings/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }
      const messages: Record<string, string> = {
        approve: "Listing approved and live.",
        pause:   "Listing hidden from feed — seller notified.",
        restore: "Listing restored and visible again.",
      };
      toast.success(messages[action] ?? "Done.");
      router.refresh();
    } catch { toast.error("Network error."); }
    finally   { setActing(null); }
  }

  async function handleReject(id: string) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/marketplace/listings/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }
      toast("Listing rejected — seller notified.");
      setRejectId(null);
      setRejectReason("");
      router.refresh();
    } catch { toast.error("Network error."); }
    finally   { setActing(null); }
  }

  async function handleDelete(id: string) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/marketplace/listings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }
      toast("Listing deleted.");
      setDeleteId(null);
      router.refresh();
    } catch { toast.error("Network error."); }
    finally   { setActing(null); }
  }

  function ListingCard({ l, showApprove = false }: { l: Listing; showApprove?: boolean }) {
    const cfg = STATUS_STYLE[l.status] ?? STATUS_STYLE.expired;
    const isActing = acting === l.id;
    return (
      <div style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 12, padding: "12px 14px" }}>
          {/* Photo */}
          <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", backgroundColor: "var(--color-light)", flexShrink: 0 }}>
            {l.images[0]
              ? <img src={l.images[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📦</div>
            }
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {l.title}
              </p>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                {cfg.label}
              </span>
            </div>
            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
              ₦{l.price.toLocaleString("en-NG")}
            </p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
              {l.category} · {l.condition} · {l.lga}, {l.state}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>
                {l.sellerName ?? "Unknown seller"}
              </p>
              {l.sellerPhone && (
                <a href={`tel:${l.sellerPhone}`}
                  style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none" }}>
                  📞 {l.sellerPhone}
                </a>
              )}
            </div>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
              {timeAgo(l.createdAt)}
            </p>
            {l.reportCount > 0 && (
              <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#C62828", margin: "0 0 2px" }}>
                  🚨 {l.reportCount} report{l.reportCount > 1 ? "s" : ""}
                </p>
                {l.reportReasons.slice(0, 2).map((r, i) => (
                  <p key={i} style={{ fontSize: 10, color: "#C62828", margin: 0, opacity: 0.8 }}>• {r}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, padding: "0 14px 12px", flexWrap: "wrap" }}>
          <a href={`/marketplace/${l.id}`} target="_blank" rel="noopener noreferrer"
            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textDecoration: "none", display: "flex", alignItems: "center" }}>
            View
          </a>

          {/* Approve — pending and flagged listings */}
          {showApprove && (
            <button onClick={() => handleAction(l.id, "approve")} disabled={isActing}
              style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", backgroundColor: "#15803D", color: "#fff", fontSize: 12, fontWeight: 700, cursor: isActing ? "not-allowed" : "pointer", opacity: isActing ? 0.7 : 1 }}>
              {isActing ? "…" : "✅ Approve"}
            </button>
          )}
          {showApprove && (
            <button onClick={() => handleAction(l.id, "reject")} disabled={isActing}
              style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", color: "#C62828", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ❌ Reject
            </button>
          )}

          {/* Pause — active listings only */}
          {l.status === "active" && (
            <button onClick={() => handleAction(l.id, "pause")} disabled={isActing}
              style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #FCD34D", backgroundColor: "#FFF8E1", color: "#92400E", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              ⏸ Pause
            </button>
          )}

          {/* Restore — flagged or expired listings */}
          {["flagged", "expired"].includes(l.status) && (
            <button onClick={() => handleAction(l.id, "restore")} disabled={isActing}
              style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ↩ Restore to active
            </button>
          )}

          <button onClick={() => setDeleteId(l.id)} disabled={isActing}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            🗑
          </button>
        </div>
      </div>
    );
  }

  function Section({ title, count, items, showApprove, urgentBg }: { title: string; count: number; items: Listing[]; showApprove?: boolean; urgentBg?: string }) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", borderRadius: 10, backgroundColor: urgentBg ?? "var(--color-light)" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {title}
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: "var(--color-primary)", color: "#fff" }}>
            {count}
          </span>
        </div>
        {items.map((l) => <ListingCard key={l.id} l={l} showApprove={showApprove} />)}
      </div>
    );
  }

  const allCount = pending.length + active.length + flagged.length + others.length + reported.length;

  return (
    <div style={{ padding: "20px 16px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: "0 0 2px" }}>Market Listings</h1>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{allCount} total · {pending.length} pending · {reported.length} reported</p>
        </div>
      </div>

      <Section title="🚨 Reported — needs review" count={reported.length} items={reported} showApprove urgentBg="#FEF2F2" />
      <Section title="Pending Approval" count={pending.length} items={pending} showApprove urgentBg="#FFF8E1" />
      <Section title="Flagged"          count={flagged.length} items={flagged} showApprove urgentBg="#FEF2F2" />
      <Section title="Active"           count={active.length}  items={active} />
      <Section title="Others"           count={others.length}  items={others} />

      {allCount === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>No listings yet</p>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setRejectId(null); }}>
          <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--color-header)", margin: "0 0 12px" }}>Reject listing</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 12px" }}>Tell the seller what needs to be fixed. They will receive this as a notification.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
              placeholder="e.g. Photos are blurry — please upload clearer images. Price appears higher than market rate."
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 13, resize: "none", boxSizing: "border-box", marginBottom: 12, backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            />
            <button onClick={() => handleReject(rejectId)} disabled={acting === rejectId}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", backgroundColor: "#C62828", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 8 }}>
              {acting === rejectId ? "Rejecting…" : "Reject and notify seller"}
            </button>
            <button onClick={() => setRejectId(null)}
              style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "#C62828", margin: "0 0 8px" }}>Delete listing?</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px" }}>This permanently removes the listing and all photos from Cloudinary. Seller will be notified.</p>
            <button onClick={() => handleDelete(deleteId)} disabled={acting === deleteId}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", backgroundColor: "#C62828", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 8 }}>
              {acting === deleteId ? "Deleting…" : "Yes, delete permanently"}
            </button>
            <button onClick={() => setDeleteId(null)}
              style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}