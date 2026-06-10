"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Listing = {
  id: string;
  title: string;
  description: string;
  address: string;
  lga: string;
  state: string;
  price: number;
  type: string;
  status: string;
  lastStatusUpdate: Date;
  landlordOtpVerified: boolean | null;
  images: string[] | null;
};

type IncomingBooking = {
  id:          string;
  bookingCode: string;
  status:      string;
  agreedDate:  Date | null;
  agreedTime:  string | null;
  listingId:   string;
  renterId:    string;
  renterName:  string;
  renterPhone: string | null;
  renterEmail: string;
};

type Props = {
  agentName:        string;
  listings:         Listing[];
  incomingBookings: IncomingBooking[];
  expiringListings: Listing[];
  staleListings:    Listing[];
  completedCount:   number;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "available",        label: "Available" },
  { value: "occupied",         label: "Occupied" },
  { value: "temp-unavailable", label: "Temp unavailable" },
];

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  available:          { bg: "#EAF3DE", color: "#27500A", dot: "#43A047" },
  occupied:           { bg: "#FCEBEB", color: "#791F1F", dot: "#E53935" },
  "temp-unavailable": { bg: "#F3F4F6", color: "#4B5563", dot: "#9CA3AF" },
  reserved:           { bg: "#EEF2FF", color: "#3730A3", dot: "#6366F1" },
  "under-review":     { bg: "#FFF8E1", color: "#92400E", dot: "#F59E0B" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function daysAgo(date: Date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntilExpiry(date: Date) {
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + 7);
  return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ─── VERIFY STATE ─────────────────────────────────────────────────────────────

type VerifyStep = "idle" | "sending" | "code-shown" | "confirming" | "done";
type VerifyState = {
  step:         VerifyStep;
  code?:        string;
  maskedEmail?: string;
  error?:       string;
};

// ─── BOOKING STATUS PILL ──────────────────────────────────────────────────────

function BookingStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    verified:  { label: "Visited ✓",     bg: "#E8F5E9", color: "#2E7D32" },
    scheduled: { label: "Scheduled",     bg: "#EEF2FF", color: "#3730A3" },
    pending:   { label: "Awaiting date", bg: "#FFF8E1", color: "#92400E" },
    completed: { label: "Completed",     bg: "#F3F4F6", color: "#374151" },
    cancelled: { label: "Cancelled",     bg: "#FEF2F2", color: "#C62828" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <p style={{
        margin: 0, fontSize: 11, fontWeight: 700,
        color: "var(--color-text-muted)", textTransform: "uppercase",
        letterSpacing: "0.06em", fontFamily: "var(--font-heading)",
      }}>
        {label}
      </p>
      {count !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
          background: "var(--color-light)", color: "var(--color-primary)",
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div style={{
      background: "var(--color-card)", border: "1px solid var(--color-border)",
      borderRadius: 18, padding: "36px 24px", textAlign: "center",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
        {message}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}

// ─── INCOMING BOOKING CARD ────────────────────────────────────────────────────

function IncomingBookingCard({ booking, onVerified }: { booking: IncomingBooking; onVerified: () => void }) {
  const isScheduled = booking.status === "scheduled";
  const isVerified  = booking.status === "verified";
  const initial     = booking.renterName?.charAt(0).toUpperCase() ?? "C";
  const [vs, setVs] = useState<VerifyState>({ step: "idle" });

  async function handleSendCode() {
    setVs({ step: "sending" });
    try {
      const res  = await fetch("/api/bookings/send-verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVs({ step: "idle", error: data.error ?? "Failed to send code." });
        toast.error(data.error ?? "Failed to send code.");
        return;
      }
      setVs({ step: "code-shown", code: data.code, maskedEmail: data.maskedRenterEmail });
    } catch {
      setVs({ step: "idle", error: "Network error." });
      toast.error("Network error. Try again.");
    }
  }

  async function handleConfirm() {
    setVs((prev) => ({ ...prev, step: "confirming" }));
    try {
      const res  = await fetch("/api/bookings/confirm-verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, code: vs.code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVs((prev) => ({ ...prev, step: "code-shown", error: data.error ?? "Confirmation failed." }));
        toast.error(data.error ?? "Confirmation failed.");
        return;
      }
      setVs({ step: "done" });
      toast.success("Visit verified!");
      onVerified();
    } catch {
      setVs((prev) => ({ ...prev, step: "code-shown", error: "Network error." }));
      toast.error("Network error. Try again.");
    }
  }

  return (
    <div style={{
      background: "var(--color-card)", border: "1px solid var(--color-border)",
      borderRadius: 18, overflow: "hidden",
    }}>
      {/* Color-coded top strip */}
      <div style={{
        height: 3,
        background: isVerified ? "#43A047" : isScheduled ? "#6366F1" : "#F59E0B",
      }} />

      <div style={{ padding: 16 }}>
        {/* Client row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "var(--color-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16,
            color: "var(--color-primary)", flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)" }}>
              {booking.renterName}
            </p>
            <p style={{ margin: "2px 0 0", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>
              {booking.bookingCode}
            </p>
          </div>
          <BookingStatusPill status={booking.status} />
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--color-border)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Visit Date
            </p>
            {booking.agreedDate ? (
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                {formatDate(booking.agreedDate)}{booking.agreedTime ? ` · ${booking.agreedTime}` : ""}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Not scheduled</p>
            )}
          </div>
          <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--color-border)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Contact
            </p>
            {booking.renterPhone ? (
              <a href={`tel:${booking.renterPhone}`} style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none", display: "block" }}>
                {booking.renterPhone}
              </a>
            ) : (
              <a href={`mailto:${booking.renterEmail}`} style={{ margin: 0, fontSize: 11, color: "var(--color-primary)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {booking.renterEmail}
              </a>
            )}
          </div>
        </div>

        {/* Verify section */}
        {isScheduled && vs.step === "idle" && (
          <button onClick={handleSendCode} style={{
            width: "100%", padding: "13px", borderRadius: 14,
            background: "var(--color-primary)", color: "#fff", border: "none",
            fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z" stroke="white" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Send Verification Code
          </button>
        )}

        {isScheduled && vs.step === "sending" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Sending code to client…</span>
          </div>
        )}

        {isScheduled && vs.step === "code-shown" && (
          <div style={{ background: "var(--color-bg)", borderRadius: 14, padding: 16, border: "1px solid var(--color-border)" }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Verification Code
            </p>
            <div style={{ background: "var(--color-light)", borderRadius: 12, padding: "16px 12px", textAlign: "center", marginBottom: 12, border: "1px solid var(--color-border)" }}>
              <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 900, letterSpacing: 6, color: "var(--color-primary)" }}>
                {vs.code}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
                Sent to {vs.maskedEmail}
              </p>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center", lineHeight: 1.5 }}>
              Ask the client to read the code aloud. Confirm if it matches.
            </p>
            {vs.error && (
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#E53935", textAlign: "center" }}>{vs.error}</p>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button onClick={() => setVs({ step: "idle" })} style={{
                flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                background: "var(--color-card)", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={handleConfirm} style={{
                flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: "var(--color-primary)", border: "none", color: "#fff",
                cursor: "pointer", fontFamily: "var(--font-heading)",
              }}>
                Confirm Visit ✓
              </button>
            </div>
            <button onClick={handleSendCode} style={{
              width: "100%", fontSize: 12, color: "var(--color-text-muted)",
              background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
            }}>
              Resend code
            </button>
          </div>
        )}

        {isScheduled && vs.step === "confirming" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Confirming visit…</span>
          </div>
        )}

        {(isVerified || vs.step === "done") && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, background: "#E8F5E9", border: "1px solid var(--color-border)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32" }}>Visit verified</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LISTING CARD ─────────────────────────────────────────────────────────────

function ListingCard({
  listing, currentStatus, updatingId, deletingId, onStatusChange, onMenuOpen,
}: {
  listing:        Listing;
  currentStatus:  string;
  updatingId:     string | null;
  deletingId:     string | null;
  onStatusChange: (id: string, status: string) => void;
  onMenuOpen:     (id: string) => void;
}) {
  const badge      = statusStyle[currentStatus] ?? statusStyle.available;
  const coverImage = listing.images?.[0] ?? null;
  const isDeleting = deletingId === listing.id;

  return (
    <div style={{
      background: "var(--color-card)", border: "1px solid var(--color-border)",
      borderRadius: 18, overflow: "hidden",
      opacity: isDeleting ? 0.5 : 1, transition: "opacity 0.2s",
    }}>
      {/* Image */}
      <div style={{ position: "relative", height: 172 }}>
        {coverImage ? (
          <img src={coverImage} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#7A9A7A" strokeWidth="1.4" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#7A9A7A" strokeWidth="1.4" />
              <path d="M21 15l-5-5L5 21" stroke="#7A9A7A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)" }} />

        {/* Status badge */}
        <span style={{
          position: "absolute", top: 12, left: 12,
          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
          background: badge.bg, color: badge.color,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: badge.dot, display: "inline-block" }} />
          {currentStatus.replace(/-/g, " ")}
        </span>

        {/* Menu */}
        <button
          onClick={() => onMenuOpen(listing.id)}
          disabled={isDeleting}
          style={{
            position: "absolute", top: 12, right: 12,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {isDeleting ? (
            <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="12" r="1.5" fill="white" />
              <circle cx="12" cy="12" r="1.5" fill="white" />
              <circle cx="19" cy="12" r="1.5" fill="white" />
            </svg>
          )}
        </button>

        {/* Price */}
        <p style={{
          position: "absolute", bottom: 12, left: 12, margin: 0,
          fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, color: "#fff",
          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}>
          ₦{listing.price.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>/yr</span>
        </p>
      </div>

      {/* Details */}
      <div style={{ padding: "14px 16px" }}>
        <p style={{ margin: "0 0 2px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)" }}>
          {listing.title}
        </p>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--color-text-muted)" }}>
          {listing.lga}, {listing.state}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--color-text-muted)", flexShrink: 0 }}>Status:</label>
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(listing.id, e.target.value)}
            disabled={updatingId === listing.id}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 12,
              border: "1.5px solid var(--color-border)", background: "var(--color-bg)",
              color: "var(--color-text)", maxWidth: 180,
              opacity: updatingId === listing.id ? 0.5 : 1,
            }}
          >
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {updatingId === listing.id && (
            <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AgentDashboardClient({
  agentName,
  listings,
  incomingBookings,
  expiringListings,
  staleListings,
  completedCount,
}: Props) {
  const router = useRouter();
  void router;

  const [statusMap, setStatusMap]           = useState<Record<string, string>>(
    Object.fromEntries(listings.map((l) => [l.id, l.status]))
  );
  const [deletedIds, setDeletedIds]         = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId]         = useState<string | null>(null);
  const [sheetListingId, setSheetListingId] = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [bookings, setBookings]             = useState(incomingBookings);
  const [activeTab, setActiveTab]           = useState<"bookings" | "listings">("bookings");

  const initial         = agentName ? agentName.charAt(0).toUpperCase() : "A";
  const visibleListings = listings.filter((l) => !deletedIds.has(l.id));
  const sheetListing    = sheetListingId ? listings.find((l) => l.id === sheetListingId) : null;
  const activeBookings  = bookings.filter((b) => b.status !== "verified" && b.status !== "completed" && b.status !== "cancelled");
  const doneBookings    = bookings.filter((b) => b.status === "verified" || b.status === "completed");
  const visibleStale    = staleListings.filter((l) => !deletedIds.has(l.id));
  const visibleExpiring = expiringListings.filter((l) => !deletedIds.has(l.id));
  const alertCount      = activeBookings.length + visibleExpiring.length + visibleStale.length;

  async function handleDelete(listingId: string, mode: "temporary" | "permanent") {
    setSheetListingId(null);
    setDeletingId(listingId);
    try {
      const res  = await fetch("/api/properties/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, mode }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed. Try again."); setDeletingId(null); return; }
      if (mode === "permanent") {
        setDeletedIds((prev) => new Set([...prev, listingId]));
        toast.success("Listing deleted.");
      } else {
        setStatusMap((prev) => ({ ...prev, [listingId]: "temp-unavailable" }));
        toast.success("Listing hidden.");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusUpdate(listingId: string, newStatus: string) {
    setStatusMap((prev) => ({ ...prev, [listingId]: newStatus }));
    setUpdatingId(listingId);
    try {
      await fetch("/api/properties/update-status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, status: newStatus }),
      });
    } finally {
      setUpdatingId(null);
    }
  }

  function handleVerified(bookingId: string) {
    setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "verified" } : b));
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)" }}>

      {/* ── HEADER ── */}
      <header style={{ background: "#1B2E1B", padding: "16px 16px 0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "var(--color-primary)", border: "2px solid #43A047",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16,
                color: "#E8F5E9", flexShrink: 0,
              }}>
                {initial}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: "#7A9A7A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Agent Dashboard
                </p>
                <p style={{ margin: "2px 0 0", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "#E8F5E9" }}>
                  {agentName}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { num: activeBookings.length, label: "Active",   color: "#FAC775" },
                { num: visibleListings.length, label: "Listings", color: "#A5D6A7" },
                { num: completedCount,         label: "Done",     color: "#7A9A7A" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1 }}>
                    {s.num}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 9, color: "#7A9A7A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {(["bookings", "listings"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const badge    = tab === "bookings" ? activeBookings.length : visibleListings.length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: "10px 0 12px",
                    background: "none", border: "none", cursor: "pointer",
                    borderBottom: isActive ? "2px solid #43A047" : "2px solid transparent",
                    marginBottom: -1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-heading)", fontWeight: isActive ? 700 : 500,
                    fontSize: 13, color: isActive ? "#E8F5E9" : "#7A9A7A",
                    textTransform: "capitalize",
                  }}>
                    {tab}
                  </span>
                  {badge > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20,
                      background: isActive ? "#43A047" : "rgba(255,255,255,0.1)",
                      color: isActive ? "#fff" : "#7A9A7A",
                    }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 100px" }}>

        {/* Alerts banner */}
        {alertCount > 0 && (
          <div style={{
            background: "#FAEEDA", border: "1px solid #FAC775",
            borderRadius: 14, padding: "12px 14px", marginBottom: 20,
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" stroke="#854F0B" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="#854F0B" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#633806", fontFamily: "var(--font-heading)" }}>
                {alertCount} item{alertCount > 1 ? "s" : ""} need{alertCount === 1 ? "s" : ""} attention
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#854F0B", lineHeight: 1.5 }}>
                {[
                  activeBookings.length > 0 && `${activeBookings.length} active booking${activeBookings.length > 1 ? "s" : ""}`,
                  visibleStale.length > 0 && `${visibleStale.length} stale listing${visibleStale.length > 1 ? "s" : ""}`,
                  visibleExpiring.length > 0 && `${visibleExpiring.length} expiring soon`,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Stale listings reminder */}
            {visibleStale.length > 0 && (
              <div>
                <SectionHeader label="Availability reminder" />
                <div style={{ background: "#EAF3DE", border: "1px solid #C0DD97", borderRadius: 14, padding: 14 }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "#3B6D11", lineHeight: 1.5 }}>
                    {visibleStale.length} listing{visibleStale.length > 1 ? "s haven't" : " hasn't"} been updated in 5+ days. Keep availability current so clients don't book unavailable properties.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {visibleStale.map((l) => (
                      <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid #C0DD97" }}>
                        <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#27500A", fontWeight: 500 }}>
                          {l.title}
                        </span>
                        <select
                          value={statusMap[l.id] ?? l.status}
                          onChange={(e) => handleStatusUpdate(l.id, e.target.value)}
                          disabled={updatingId === l.id}
                          style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #97C459", background: "#fff", color: "#27500A", flexShrink: 0 }}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active bookings */}
            <div>
              <SectionHeader label="Active Bookings" count={activeBookings.length} />
              {activeBookings.length === 0 ? (
                <EmptyState
                  message="No active bookings"
                  sub="Bookings from clients will appear here once they pay the inspection fee."
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeBookings.map((b) => (
                    <IncomingBookingCard key={b.id} booking={b} onVerified={() => handleVerified(b.id)} />
                  ))}
                </div>
              )}
            </div>

            {/* Verified visits */}
            {doneBookings.length > 0 && (
              <div>
                <SectionHeader label="Verified Visits" count={doneBookings.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {doneBookings.map((b) => (
                    <IncomingBookingCard key={b.id} booking={b} onVerified={() => handleVerified(b.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LISTINGS TAB ── */}
        {activeTab === "listings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Expiring soon */}
            {visibleExpiring.length > 0 && (
              <div>
                <SectionHeader label="Expiring Soon" count={visibleExpiring.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {visibleExpiring.map((l) => {
                    const days = daysUntilExpiry(l.lastStatusUpdate);
                    return (
                      <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FAEEDA", border: "1px solid #FAC775", borderRadius: 14, padding: "12px 14px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" stroke="#854F0B" strokeWidth="1.8" />
                          <path d="M12 7v5l3 3" stroke="#854F0B" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#633806", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.title}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#854F0B" }}>
                            Last updated {daysAgo(l.lastStatusUpdate)}d ago
                          </p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fff", color: "#854F0B", flexShrink: 0 }}>
                          {days === 0 ? "Today" : `${days}d left`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All listings */}
            <div>
              <SectionHeader label="My Listings" count={visibleListings.length} />
              {visibleListings.length === 0 ? (
                <EmptyState
                  message="No listings yet"
                  sub="Add your first property to start receiving bookings from clients."
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {visibleListings.map((l) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      currentStatus={statusMap[l.id] ?? l.status}
                      updatingId={updatingId}
                      deletingId={deletingId}
                      onStatusChange={handleStatusUpdate}
                      onMenuOpen={setSheetListingId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Add listing CTA */}
            <Link href="/agent/listings/new" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "15px", borderRadius: 16, background: "var(--color-primary)",
              color: "#fff", textDecoration: "none",
              fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              Add new listing
            </Link>
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET BACKDROP ── */}
      {sheetListingId && (
        <div onClick={() => setSheetListingId(null)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)" }} />
      )}

      {/* ── BOTTOM SHEET ── */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        borderRadius: "22px 22px 0 0", background: "var(--color-card)",
        transform: sheetListingId ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        maxWidth: 640, margin: "0 auto",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
        </div>
        <div style={{ padding: "0 16px 14px", borderBottom: "1px solid var(--color-border)" }}>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sheetListing?.title ?? "Listing"}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Choose an action</p>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => sheetListingId && handleDelete(sheetListingId, "temporary")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"
                  stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>Hide temporarily</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Hidden from clients. Restore anytime.</p>
            </div>
          </button>

          <button
            onClick={() => sheetListingId && handleDelete(sheetListingId, "permanent")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: "#FEF2F2", border: "1px solid #FECACA", cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#C62828" }}>Delete permanently</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#E57373" }}>Removes listing and all photos. Cannot be undone.</p>
            </div>
          </button>

          <button
            onClick={() => setSheetListingId(null)}
            style={{ width: "100%", padding: "14px", borderRadius: 16, background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}