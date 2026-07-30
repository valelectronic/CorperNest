"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AdminBooking = {
  id:               string;
  bookingCode:      string;
  status:           string;
  createdAt:        Date;
  renterId:         string;
  agentId:          string;
  listingId:        string;
  listingTitle:     string;
  listingLga:       string;
  listingImages:    string[] | null;
  listingStatus:    string;
  clientName:       string;
  clientPhone:      string | null;
  agentName:        string;
  agentPhone:       string | null;
  commissionStatus: string | null;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date) {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const BOOKING_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Awaiting Visit",    bg: "#EEF2FF", color: "#4338CA" },
  verified:  { label: "Visit Confirmed ✓", bg: "#E8F5E9", color: "#2E7D32" },
  completed: { label: "Completed",         bg: "#F3F4F6", color: "#6B7280" },
};

// ─── ACTION SUMMARY BADGES ────────────────────────────────────────────────────
// Shown at the top of verified booking cards — at-a-glance view of what
// has already been done so you never forget or accidentally double-trigger.

function ActionSummary({
  commissionStatus,
  listingStatus,
}: {
  commissionStatus: string | null;
  listingStatus:    string;
}) {
  const commissionDone = commissionStatus === "requested" || commissionStatus === "paid";
  const listingActioned = listingStatus === "occupied" || listingStatus === "available";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
      {/* Commission status — only show if listing is reserved or occupied */}
      {listingStatus !== "available" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: commissionStatus === "paid" ? "#E8F5E9" : commissionDone ? "#FFF8E1" : "#F3F4F6",
          color:      commissionStatus === "paid" ? "#2E7D32" : commissionDone ? "#92400E" : "#6B7280",
          border: `1px solid ${commissionStatus === "paid" ? "#A5D6A7" : commissionDone ? "#FAC775" : "var(--color-border)"}`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
          Commission: {commissionStatus === "paid" ? "Paid ✓" : commissionDone ? "Requested" : "Not sent"}
        </div>
      )}

      {/* Listing status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: listingStatus === "occupied" ? "#FEF2F2" : listingStatus === "available" ? "#EEF2FF" : "#FFF8E1",
        color:      listingStatus === "occupied" ? "#C62828" : listingStatus === "available" ? "#4338CA" : "#92400E",
        border: `1px solid ${listingStatus === "occupied" ? "#FECACA" : listingStatus === "available" ? "#C7D2FE" : "#FAC775"}`,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
        Listing: {listingStatus === "occupied" ? "Occupied" : listingStatus === "available" ? "Available" : "Reserved"}
      </div>
    </div>
  );
}

// ─── COMMISSION ACTION ─────────────────────────────────────────────────────────

function CommissionAction({ bookingId, initialStatus, listingStatus }: {
  bookingId:     string;
  initialStatus: string | null;
  listingStatus: string;
}) {
  const [sending, setSending] = useState(false);
  const [status,  setStatus]  = useState(initialStatus);

  // No commission owed if client passed (listing released to available)
  // No button needed if already paid
  if (status === "paid" || listingStatus === "available") return null;

  async function handleSend() {
    setSending(true);
    try {
      const res  = await fetch(`/api/admin/bookings/${bookingId}/send-commission`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      setStatus("requested");
      toast.success("Commission request sent to agent");
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  }

  return (
    <button onClick={handleSend} disabled={sending}
      style={{ width: "100%", padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: status === "requested" ? "#F0FDF4" : "#FFF8E1", border: `1px solid ${status === "requested" ? "#86EFAC" : "#FAC775"}`, color: status === "requested" ? "#15803D" : "#92400E", cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: sending ? 0.6 : 1 }}>
      {sending ? "Sending…" : status === "requested" ? "✓ Commission requested — send again?" : "💰 Send Commission Request"}
    </button>
  );
}

// ─── LISTING STATUS CONTROL ────────────────────────────────────────────────────

function ListingStatusControl({ listingId, currentStatus }: { listingId: string; currentStatus: string }) {
  const [acting,      setActing]      = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState(currentStatus);

  async function updateStatus(status: "occupied" | "available") {
    setActing(status);
    try {
      const res  = await fetch(`/api/admin/listings/${listingId}/status`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      setLocalStatus(status);
      toast.success(
        status === "occupied"
          ? "Listing marked occupied — off market ✓"
          : "Listing released back to available ✓"
      );
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setActing(null);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", margin: "0 0 6px" }}>
        What happened after your call?
      </p>
      {/* Stack buttons vertically on mobile — both full width */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button onClick={() => updateStatus("occupied")}
          disabled={!!acting || localStatus === "occupied"}
          style={{ width: "100%", padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: localStatus === "occupied" ? "#E8F5E9" : "var(--color-bg)", border: `1.5px solid ${localStatus === "occupied" ? "#86EFAC" : "#A5D6A7"}`, color: localStatus === "occupied" ? "#15803D" : "#2E7D32", cursor: localStatus === "occupied" || !!acting ? "not-allowed" : "pointer", opacity: acting === "occupied" ? 0.6 : 1 }}>
          {acting === "occupied" ? "Marking…" : localStatus === "occupied" ? "✓ Marked as occupied" : "🏠 Client Rented It"}
        </button>
        <button onClick={() => updateStatus("available")}
          disabled={!!acting || localStatus === "available"}
          style={{ width: "100%", padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: localStatus === "available" ? "#EEF2FF" : "var(--color-bg)", border: `1.5px solid ${localStatus === "available" ? "#A5B4FC" : "#C7D2FE"}`, color: localStatus === "available" ? "#3730A3" : "#4338CA", cursor: localStatus === "available" || !!acting ? "not-allowed" : "pointer", opacity: acting === "available" ? 0.6 : 1 }}>
          {acting === "available" ? "Releasing…" : localStatus === "available" ? "✓ Released to available" : "↩ Client Passed"}
        </button>
      </div>
    </div>
  );
}

// ─── EXPANDABLE CONTROLS ───────────────────────────────────────────────────────
// Keeps the booking card clean by default.
// Admin taps "Manage" to expand the controls when ready to act.

function ExpandableControls({
  bookingId, listingId, commissionStatus, listingStatus,
}: {
  bookingId:        string;
  listingId:        string;
  commissionStatus: string | null;
  listingStatus:    string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
      <button onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {open ? "Hide controls" : "Manage this booking"}
      </button>

      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <CommissionAction
            bookingId={bookingId}
            initialStatus={commissionStatus}
            listingStatus={listingStatus}
          />
          <ListingStatusControl listingId={listingId} currentStatus={listingStatus} />
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function AdminBookingsClient({ bookings }: { bookings: AdminBooking[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === "all" || b.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || [b.clientName, b.agentName, b.bookingCode, b.listingTitle, b.listingLga]
      .some((v) => v?.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const pendingCount  = bookings.filter((b) => b.status === "pending").length;
  const verifiedCount = bookings.filter((b) => b.status === "verified").length;

  return (
    <div style={{ padding: "24px 16px 80px", maxWidth: 680, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
            Bookings
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            {pendingCount} awaiting visit · {verifiedCount} confirmed
          </p>
        </div>
        <button onClick={() => router.push("/admin/bookings/pending")}
          style={{ padding: "10px 14px", borderRadius: 12, background: pendingCount > 0 ? "#FFF8E1" : "var(--color-light)", border: `1px solid ${pendingCount > 0 ? "#FAC775" : "var(--color-border)"}`, color: pendingCount > 0 ? "#92400E" : "var(--color-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-heading)" }}>
          {pendingCount > 0 ? `${pendingCount} Pending` : "Queue"}
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8" stroke="var(--color-text-muted)" strokeWidth="1.8" />
          <path d="M21 21l-4.35-4.35" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search client, agent, code…"
          style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 13, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }} />
      </div>

      {/* Filter tabs — flex wrap so they never overflow on mobile */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {(["all", "pending", "verified"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid", cursor: "pointer", background: filter === f ? "var(--color-primary)" : "var(--color-bg)", color: filter === f ? "#fff" : "var(--color-text-muted)", borderColor: filter === f ? "var(--color-primary)" : "var(--color-border)" }}>
            {f === "all" ? `All (${bookings.length})` : f === "pending" ? `Awaiting (${pendingCount})` : `Confirmed (${verifiedCount})`}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
            {search ? `No bookings match "${search}"` : "No bookings yet"}
          </p>
        </div>
      )}

      {/* Booking cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((b) => {
          const s = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.pending;
          return (
            <div key={b.id} style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 3, background: b.status === "verified" ? "#43A047" : b.status === "pending" ? "#6366F1" : "#9CA3AF" }} />

              <div style={{ padding: "14px 16px" }}>

                {/* Property + status */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  {b.listingImages?.[0] && (
                    <img src={b.listingImages[0]} alt=""
                      style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
                      <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.listingTitle}
                      </p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: s.bg, color: s.color, flexShrink: 0, whiteSpace: "nowrap" }}>
                        {s.label}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
                      {b.listingLga} · {b.bookingCode} · {timeAgo(b.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Action summary badges — only for verified bookings */}
                {b.status === "verified" && (
                  <ActionSummary
                    commissionStatus={b.commissionStatus}
                    listingStatus={b.listingStatus}
                  />
                )}

                {/* Client + Agent — stacked on mobile for readability */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Client</p>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.clientName}</p>
                    </div>
                    {b.clientPhone ? (
                      <a href={`tel:${b.clientPhone}`} style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none", fontWeight: 700, flexShrink: 0 }}>
                        {b.clientPhone}
                      </a>
                    ) : (
                      <p style={{ margin: 0, fontSize: 11, color: "#E53935", flexShrink: 0 }}>No phone</p>
                    )}
                  </div>
                  <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Agent</p>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.agentName}</p>
                    </div>
                    {b.agentPhone ? (
                      <a href={`tel:${b.agentPhone}`} style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none", fontWeight: 700, flexShrink: 0 }}>
                        {b.agentPhone}
                      </a>
                    ) : (
                      <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)", flexShrink: 0 }}>No phone</p>
                    )}
                  </div>
                </div>

                {/* Controls — tap to expand, only for verified bookings */}
                {b.status === "verified" && (
                  <ExpandableControls
                    bookingId={b.id}
                    listingId={b.listingId}
                    commissionStatus={b.commissionStatus}
                    listingStatus={b.listingStatus}
                  />
                )}

                {/* Release button for pending bookings — admin can release anytime */}
                {b.status === "pending" && (
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, marginTop: 4 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", margin: "0 0 6px" }}>
                      {Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 86400000) >= 3
                        ? `⚠ ${Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 86400000)}d since approval — client may have ghosted`
                        : "Manage listing status"}
                    </p>
                    <ListingStatusControl listingId={b.listingId} currentStatus={b.listingStatus} />
                    {/* Admin override — send commission without waiting for client */}
<div style={{ padding: "12px", borderRadius: 12, backgroundColor: "#FFFBEB", border: "1.5px solid #FCD34D", marginTop: 10 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <p style={{ fontSize: 12, fontWeight: 700, color: "#92400E", margin: 0 }}>
      Agent confirmed visit — client didn't tap the button?
    </p>
  </div>
  <p style={{ fontSize: 11, color: "#92400E", margin: "0 0 10px", lineHeight: 1.5, opacity: 0.85 }}>
    If the agent called to confirm the visit happened, you can send the commission request directly without waiting for the client.
  </p>
  <CommissionAction
    bookingId={b.id}
    initialStatus={b.commissionStatus}
    listingStatus={b.listingStatus}
  />
</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}