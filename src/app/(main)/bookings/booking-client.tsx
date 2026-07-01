"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import ReceiptUploadSheet from "@/components/receipt-upload-sheet";
import PhoneVerificationModal from "@/components/phone-verification-modal";
import MyRequestsTab, { type RequestItem } from "./my-requests-tab";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Booking {
  id:             string;
  bookingCode:    string;
  status:         "pending" | "scheduled" | "verified" | "completed" | "cancelled";
  agreedDate:     string | null;
  agreedTime:     string | null;
  visitNote:      string | null;
  createdAt:      string;
  listingId:      string;
  listingTitle:   string;
  listingType:    string;
  listingLga:     string;
  listingState:   string;
  listingPrice:   number;
  listingAddress: string | null;
  listingImages:  string[];
  agentId?:       string;
  agentName?:     string;
  agentPhone?:    string | null;
  hasReview?:     boolean;
}

interface RentRecord {
  id:             string;
  bookingId:      string;
  rentAmount:     number;
  durationMonths: number;
  paymentDate:    string;
  renewalDate:    string;
  receiptUrl:     string;
  feePaid:        boolean;
  listingTitle:   string;
  listingAddress: string;
  listingLga:     string;
}

interface Props {
  currentUserId:   string;
  currentUserName: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatPrice(naira: number) {
  return `₦${naira.toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function StatusPill({ status }: { status: Booking["status"] }) {
  const map: Record<Booking["status"], { label: string; bg: string; color: string }> = {
    pending:   { label: "Awaiting Visit", bg: "#EEF2FF", color: "#4338CA" },
    scheduled: { label: "Awaiting Visit", bg: "#EEF2FF", color: "#4338CA" },
    verified:  { label: "Visit Verified", bg: "#E8F5E9", color: "#2E7D32" },
    completed: { label: "Completed",      bg: "#F3F4F6", color: "#6B7280" },
    cancelled: { label: "Cancelled",      bg: "#FEE2E2", color: "#DC2626" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function ListingThumb({ images, title }: { images: string[]; title: string }) {
  const src = images?.[0];
  if (!src) {
    return (
      <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 9.5L12 3L21 9.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="var(--color-text-muted)" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return <img src={src} alt={title} style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />;
}

// ─── STAR RATING INPUT ────────────────────────────────────────────────────────

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={(hovered || value) >= star ? "#F59E0B" : "none"}
              stroke={(hovered || value) >= star ? "#F59E0B" : "var(--color-border)"}
              strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── REVIEW PROMPT CARD ───────────────────────────────────────────────────────

function ReviewPromptCard({ booking, onSubmitted }: { booking: Booking; onSubmitted: (bookingId: string) => void }) {
  const [rating,     setRating]     = useState(0);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissed,  setDismissed]  = useState(false);

  if (dismissed) return null;

  async function handleSubmit() {
    if (!rating) { toast.error("Please select a star rating"); return; }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/reviews/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to submit review"); return; }
      toast.success("Review submitted. Thank you!");
      onSubmitted(booking.id);
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: "var(--color-card)", border: "1.5px solid #F59E0B", borderRadius: 18, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)" }}>Rate your visit</p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>{booking.listingTitle} · {booking.agentName}</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <StarInput value={rating} onChange={setRating} />
        {rating > 0 && <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>{["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}</p>}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)..." maxLength={500} rows={3}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13, border: "1.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", resize: "none", fontFamily: "var(--font-body)", boxSizing: "border-box", lineHeight: 1.5, marginBottom: 12, outline: "none" }} />
      <button onClick={handleSubmit} disabled={submitting || rating === 0}
        style={{ width: "100%", padding: "12px", borderRadius: 12, background: rating === 0 || submitting ? "var(--color-border)" : "var(--color-primary)", color: "#fff", border: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: rating === 0 || submitting ? "not-allowed" : "pointer" }}>
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}

// ─── RENT RECORD CARD ─────────────────────────────────────────────────────────

function RentRecordCard({ record }: { record: RentRecord }) {
  const days           = daysUntil(record.renewalDate);
  const isExpiringSoon = days <= 30 && days > 0;
  const isExpired      = days <= 0;

  return (
    <div style={{
      background: "var(--color-card)", borderRadius: 16,
      border: `1px solid ${isExpiringSoon ? "#FAC775" : isExpired ? "#FECACA" : "var(--color-border)"}`,
      padding: 14, marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {record.listingTitle}
          </p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{record.listingLga}</p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, flexShrink: 0,
          background: isExpired ? "#FEE2E2" : isExpiringSoon ? "#FFF8E1" : "#E8F5E9",
          color: isExpired ? "#DC2626" : isExpiringSoon ? "#B45309" : "#2E7D32",
        }}>
          {isExpired ? "Expired" : isExpiringSoon ? `${days}d left` : "Active"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "8px 10px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>Rent Paid</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", margin: 0, fontFamily: "var(--font-heading)" }}>{formatPrice(record.rentAmount)}</p>
        </div>
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "8px 10px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>Duration</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            {record.durationMonths === 6 ? "6 months" : record.durationMonths === 12 ? "1 year" : "2 years"}
          </p>
        </div>
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "8px 10px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>Paid On</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{formatDate(record.paymentDate)}</p>
        </div>
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "8px 10px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>Renewal</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: isExpired ? "#DC2626" : isExpiringSoon ? "#B45309" : "var(--color-text)", margin: 0 }}>
            {formatDate(record.renewalDate)}
          </p>
        </div>
      </div>

      <a href={record.receiptUrl} target="_blank" rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        View receipt
      </a>
    </div>
  );
}

// ─── BOOKING CARD ─────────────────────────────────────────────────────────────
// Date setting removed entirely. Contacts are revealed immediately after
// payment. If the renter's phone is not verified, a prominent banner
// prompts them to verify — and the agent cannot see their number until
// they do. OTP visit verification is unchanged.

function BookingCard({
  booking,
  phoneNumberVerified,
  onVerifyPhone,
  onUploadReceipt,
  hasRentRecord,
}: {
  booking:              Booking;
  phoneNumberVerified:  boolean;
  onVerifyPhone:        () => void;
  onUploadReceipt:      (b: Booking) => void;
  hasRentRecord:        boolean;
}) {
  const isVisited = booking.status === "verified" || booking.status === "completed";

  return (
    <div style={{ background: "var(--color-card)", borderRadius: 18, border: "1px solid var(--color-border)", overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "14px 16px 12px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <ListingThumb images={booking.listingImages} title={booking.listingTitle} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {booking.listingTitle}
            </p>
            <StatusPill status={booking.status} />
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)" }}>{booking.listingLga}, {booking.listingState}</p>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>
            {formatPrice(booking.listingPrice)}/yr
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--color-border)" }} />

      <div style={{ padding: "12px 16px" }}>

        {/* Booking code */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Booking code</span>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>{booking.bookingCode}</span>
        </div>

        {/* ── Phone not verified — must verify before agent can reach them ── */}
        {!phoneNumberVerified && !isVisited && (
          <div style={{
            background: "#FFF8E1", border: "1.5px solid #FAC775",
            borderRadius: 12, padding: "12px 14px", marginBottom: 12,
          }}>
            <p style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "#92400E" }}>
              ⚠ Verify your phone number
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#B45309", lineHeight: 1.5 }}>
              The agent cannot see your phone number yet. Verify it so they can contact you about your visit.
            </p>
            <button onClick={onVerifyPhone}
              style={{ width: "100%", padding: "11px", borderRadius: 10, background: "#92400E", color: "#fff", border: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Verify Phone Number Now
            </button>
          </div>
        )}

        {/* Property address — revealed immediately after payment */}
        {booking.listingAddress && (
          <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--color-border)", marginBottom: 10 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Property Address</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text)", lineHeight: 1.5 }}>{booking.listingAddress}</p>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(booking.listingAddress + " " + booking.listingLga + " " + booking.listingState)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              Get Directions
            </a>
          </div>
        )}

        {/* Agent contact — revealed immediately after payment */}
        {booking.agentName && (
          <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--color-border)", marginBottom: 10 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Agent Contact</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{booking.agentName}</p>
              {booking.agentId && (
                <a href={`/agent/${booking.agentId}`} style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>View profile →</a>
              )}
            </div>
            {booking.agentPhone ? (
              <a href={`tel:${booking.agentPhone}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.8" fill="none" />
                </svg>
                {booking.agentPhone}
              </a>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Call details will be shared by the agent</p>
            )}
          </div>
        )}

        {/* Visit verified */}
        {isVisited && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, background: "#E8F5E9", border: "1px solid var(--color-border)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32" }}>Visit verified successfully</span>
            </div>

            {!hasRentRecord && (
              <button onClick={() => onUploadReceipt(booking)}
                style={{ width: "100%", padding: "12px", borderRadius: 12, background: "var(--color-bg)", border: "1.5px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Record rent payment — ₦1,000
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyBookings() {
  const router = useRouter();
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.6" />
          <path d="M16 2V6M8 2V6M3 10H21" stroke="var(--color-text-muted)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>No bookings yet</p>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>
        Find a verified property and pay the inspection fee to get started.
      </p>
      <button onClick={() => router.push("/home")}
        style={{ padding: "12px 24px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 12, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Browse Listings
      </button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function BookingsClient({ currentUserId, currentUserName }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  void currentUserId;
  void currentUserName;

  const [bookings,           setBookings]           = useState<Booking[]>([]);
  const [rentRecords,        setRentRecords]        = useState<RentRecord[]>([]);
  const [requests,           setRequests]           = useState<RequestItem[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [activeReceiptSheet, setActiveReceiptSheet] = useState<Booking | null>(null);
  const [activeTab,          setActiveTab]          = useState<"bookings" | "rent" | "requests">("bookings");
  const [showPhoneVerify,    setShowPhoneVerify]    = useState(false);
  const [dismissedReviewIds, setDismissedReviewIds] = useState<Set<string>>(new Set());

  const { data: session } = authClient.useSession();
  const phoneNumberVerified = (session?.user as { phoneNumberVerified?: boolean } | undefined)?.phoneNumberVerified ?? false;

  const fetchBookings = useCallback(async () => {
    try {
      const res  = await fetch("/api/bookings/list");
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRentRecords = useCallback(async () => {
    try {
      const res  = await fetch("/api/rent-records/list");
      const data = await res.json();
      setRentRecords(data.rentRecords ?? []);
    } catch {
      console.error("Failed to load rent records");
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res  = await fetch("/api/property-requests/mine");
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      console.error("Failed to load requests");
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchRentRecords();
    fetchRequests();
  }, [fetchBookings, fetchRentRecords, fetchRequests]);

  useEffect(() => {
    const status = searchParams.get("receipt");
    const ref    = searchParams.get("ref");
    if (status === "success" && ref) {
      window.history.replaceState({}, "", "/bookings");
      toast.success("Rent record saved! You'll be reminded before renewal.");
      fetchRentRecords();
      setActiveTab("rent");
    }
  }, [searchParams, fetchRentRecords]);

  function handleReviewSubmitted(bookingId: string) {
    setDismissedReviewIds((prev) => new Set([...prev, bookingId]));
    fetchBookings();
  }

  function handlePhoneVerified() {
    setShowPhoneVerify(false);
    // Refresh bookings so the warning banner disappears and the agent
    // can now see the renter's phone number on their side
    fetchBookings();
  }

  const pendingReviews   = bookings.filter((b) => b.status === "verified" && !b.hasReview && !dismissedReviewIds.has(b.id));
  const rentRecordBookingIds = new Set(rentRecords.map((r) => r.bookingId));
  const activeRequestCount   = requests.filter((r) => ["open", "matched"].includes(r.status)).length;

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ height: 28, width: 140, borderRadius: 8, background: "var(--color-light)", marginBottom: 24 }} />
        {[1, 2].map((i) => (
          <div key={i} style={{ background: "var(--color-card)", borderRadius: 18, border: "1px solid var(--color-border)", padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: "var(--color-light)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: "60%", borderRadius: 6, background: "var(--color-light)", marginBottom: 8 }} />
                <div style={{ height: 11, width: "40%", borderRadius: 6, background: "var(--color-light)", marginBottom: 6 }} />
                <div style={{ height: 11, width: "30%", borderRadius: 6, background: "var(--color-light)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 0 80px" }}>

      <div style={{ padding: "24px 16px 0" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          My Bookings
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          {bookings.length} inspection{bookings.length !== 1 ? "s" : ""} booked
        </p>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", margin: "16px 0 0", padding: "0 16px" }}>
        {([
          { key: "bookings", label: "Bookings",     count: bookings.length                       },
          { key: "requests", label: "Requests",     count: activeRequestCount                    },
          { key: "rent",     label: "Rent Records", count: rentRecords.filter(r => r.feePaid).length },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: "10px 0 12px", background: "none", border: "none", cursor: "pointer", borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent", marginBottom: -1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: isActive ? 700 : 500, fontSize: 13, color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                {tab.label}
              </span>
              {tab.count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 20, background: isActive ? "var(--color-light)" : "var(--color-bg)", color: isActive ? "var(--color-primary)" : "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "20px 16px 0" }}>

        {activeTab === "bookings" && (
          <>
            {pendingReviews.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px", fontFamily: "var(--font-heading)" }}>
                  Rate your visits
                </p>
                {pendingReviews.map((b) => (
                  <ReviewPromptCard key={b.id} booking={b} onSubmitted={handleReviewSubmitted} />
                ))}
              </div>
            )}

            {bookings.length === 0 && <EmptyBookings />}

            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                phoneNumberVerified={phoneNumberVerified}
                onVerifyPhone={() => setShowPhoneVerify(true)}
                onUploadReceipt={setActiveReceiptSheet}
                hasRentRecord={rentRecordBookingIds.has(b.id)}
              />
            ))}
          </>
        )}

        {activeTab === "requests" && (
          <MyRequestsTab requests={requests} onRefetch={fetchRequests} />
        )}

        {activeTab === "rent" && (
          <>
            {rentRecords.filter(r => r.feePaid).length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="var(--color-text-muted)" strokeWidth="1.6" strokeLinejoin="round" />
                    <path d="M14 2v6h6" stroke="var(--color-text-muted)" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>No rent records yet</p>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
                  After your visit is verified, upload your rent receipt to keep a secure record and get renewal reminders.
                </p>
                <button onClick={() => setActiveTab("bookings")}
                  style={{ padding: "11px 22px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 12, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Go to Bookings
                </button>
              </div>
            ) : (
              rentRecords.filter(r => r.feePaid).map((r) => <RentRecordCard key={r.id} record={r} />)
            )}
          </>
        )}
      </div>

      {/* Phone verification modal — triggered from the booking card banner */}
      {showPhoneVerify && (
        <PhoneVerificationModal
          onClose={() => setShowPhoneVerify(false)}
          onVerified={handlePhoneVerified}
        />
      )}

      {activeReceiptSheet && (
        <ReceiptUploadSheet
          bookingId={activeReceiptSheet.id}
          listingId={activeReceiptSheet.listingId}
          listingTitle={activeReceiptSheet.listingTitle}
          agentName={activeReceiptSheet.agentName ?? "Agent"}
          onClose={() => setActiveReceiptSheet(null)}
          onSuccess={() => { setActiveReceiptSheet(null); fetchRentRecords(); }}
        />
      )}
    </div>
  );
}