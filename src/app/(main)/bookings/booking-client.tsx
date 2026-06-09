"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  agentName?:     string;
  agentPhone?:    string | null;
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

function StatusPill({ status }: { status: Booking["status"] }) {
  const map: Record<Booking["status"], { label: string; bg: string; color: string }> = {
    pending:   { label: "Pending",   bg: "#FFF8E1", color: "#F59E0B" },
    scheduled: { label: "Scheduled", bg: "#E8F5E9", color: "#2E7D32" },
    verified:  { label: "Verified",  bg: "#E8F5E9", color: "#2E7D32" },
    completed: { label: "Completed", bg: "#F3F4F6", color: "#6B7280" },
    cancelled: { label: "Cancelled", bg: "#FEE2E2", color: "#DC2626" },
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

// ─── CUSTOM TIME PICKER ───────────────────────────────────────────────────────

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // value format: "2:30 PM"
  const [hour,   setHour]   = useState("8");
  const [minute, setMinute] = useState("00");
  const [ampm,   setAmpm]   = useState("AM");

  // Sync internal state with value prop
  useEffect(() => {
    if (value) {
      const match = value.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match) {
        setHour(match[1]);
        setMinute(match[2]);
        setAmpm(match[3].toUpperCase());
      }
    }
  }, []);

  function update(h: string, m: string, a: string) {
    onChange(`${h}:${m} ${a}`);
  }

  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {/* Hour */}
      <select
        value={hour}
        onChange={(e) => { setHour(e.target.value); update(e.target.value, minute, ampm); }}
        style={{
          flex: 1, padding: "13px 10px", borderRadius: 12,
          border: "1.5px solid var(--color-border)", fontSize: 16, fontWeight: 700,
          color: "var(--color-text)", background: "var(--color-bg)",
          textAlign: "center", fontFamily: "var(--font-mono)",
        }}
      >
        {hours.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>

      <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-muted)" }}>:</span>

      {/* Minute */}
      <select
        value={minute}
        onChange={(e) => { setMinute(e.target.value); update(hour, e.target.value, ampm); }}
        style={{
          flex: 1, padding: "13px 10px", borderRadius: 12,
          border: "1.5px solid var(--color-border)", fontSize: 16, fontWeight: 700,
          color: "var(--color-text)", background: "var(--color-bg)",
          textAlign: "center", fontFamily: "var(--font-mono)",
        }}
      >
        {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      {/* AM/PM */}
      <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--color-border)", flexShrink: 0 }}>
        {["AM", "PM"].map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => { setAmpm(a); update(hour, minute, a); }}
            style={{
              padding: "13px 16px", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700,
              background: ampm === a ? "var(--color-primary)" : "var(--color-bg)",
              color: ampm === a ? "#fff" : "var(--color-text-muted)",
              transition: "background 0.15s",
            }}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SET DATE BOTTOM SHEET ────────────────────────────────────────────────────

function SetDateSheet({ booking, onClose, onSuccess }: { booking: Booking; onClose: () => void; onSuccess: () => void }) {
  const [date,    setDate]    = useState("");
  const [time,    setTime]    = useState("8:00 AM");
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleSubmit() {
    if (!date) { toast.error("Please select a visit date"); return; }
    if (!time) { toast.error("Please select a time"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/set-date", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId: booking.id, agreedDate: date, agreedTime: time }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to set date");
      }

      toast.success("Visit scheduled! Agent details are now visible.");
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", background: "var(--color-card)", borderRadius: "22px 22px 0 0", padding: "8px 20px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "8px auto 20px" }} />

        <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--color-primary)" strokeWidth="1.8" />
            <path d="M16 2V6M8 2V6M3 10H21" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="15" r="2" fill="var(--color-primary)" />
          </svg>
        </div>

        <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 6px" }}>
          Schedule your visit
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
          Pick when you want to inspect <strong>{booking.listingTitle}</strong>. Agent contact and full address revealed immediately.
        </p>

        {/* Date */}
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
          Visit Date
        </label>
        <input
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: "100%", padding: "13px 14px", borderRadius: 12,
            border: "1.5px solid var(--color-border)", fontSize: 14,
            color: "var(--color-text)", background: "var(--color-bg)",
            marginBottom: 16, boxSizing: "border-box",
          }}
        />

        {/* Time — custom AM/PM picker */}
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8, display: "block" }}>
          Preferred Time
        </label>
        <div style={{ marginBottom: 24 }}>
          <TimePicker value={time} onChange={setTime} />
        </div>

        {/* Selected summary */}
        {date && time && (
          <div style={{ background: "var(--color-light)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>
              📅 {new Date(date).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })} at {time}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !date}
          style={{
            width: "100%", padding: "15px",
            background: loading || !date ? "var(--color-border)" : "var(--color-primary)",
            color: "#fff", border: "none", borderRadius: 14,
            fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15,
            cursor: loading || !date ? "not-allowed" : "pointer",
            marginBottom: 10, transition: "background 0.2s",
          }}
        >
          {loading ? "Scheduling…" : "Confirm Visit Date"}
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "15px",
            background: "var(--color-bg)", color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)", borderRadius: 14,
            fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, cursor: "pointer",
          }}
        >
          I'll do this later from My Bookings
        </button>
      </div>
    </div>
  );
}

// ─── BOOKING CARD ─────────────────────────────────────────────────────────────

function BookingCard({ booking, onSetDate }: { booking: Booking; onSetDate: (b: Booking) => void }) {
  const isScheduled = booking.status !== "pending";

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
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)" }}>
            {booking.listingLga}, {booking.listingState}
          </p>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>
            {formatPrice(booking.listingPrice)}/yr
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--color-border)" }} />

      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Booking code</span>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>{booking.bookingCode}</span>
        </div>

        {booking.agreedDate && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Visit date</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
              {formatDate(booking.agreedDate)} · {booking.agreedTime}
            </span>
          </div>
        )}

        {isScheduled && booking.listingAddress && (
          <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--color-border)", marginBottom: 10 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Property Address</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text)", lineHeight: 1.5 }}>{booking.listingAddress}</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(booking.listingAddress + " " + booking.listingLga + " " + booking.listingState)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              Get Directions
            </a>
          </div>
        )}

        {isScheduled && booking.agentName && (
          <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--color-border)", marginBottom: 10 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Agent Contact</p>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{booking.agentName}</p>
            {booking.agentPhone && (
              <a href={`tel:${booking.agentPhone}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.8" fill="none" />
                </svg>
                {booking.agentPhone}
              </a>
            )}
          </div>
        )}

        {booking.status === "pending" && (
          <button
            onClick={() => onSetDate(booking)}
            style={{ width: "100%", padding: "13px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4 }}
          >
            Schedule Visit Date
          </button>
        )}

        {booking.status === "verified" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, background: "#E8F5E9", border: "1px solid var(--color-border)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32" }}>Visit verified successfully</span>
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
      <button
        onClick={() => router.push("/home")}
        style={{ padding: "12px 24px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 12, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
      >
        Browse Listings
      </button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function BookingsClient({ currentUserId, currentUserName }: Props) {
  const [bookings, setBookings]               = useState<Booking[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [activeDateSheet, setActiveDateSheet] = useState<Booking | null>(null);

  void currentUserId;
  void currentUserName;

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

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  function handleDateSuccess() {
    setActiveDateSheet(null);
    fetchBookings();
  }

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
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          My Bookings
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          {bookings.length} inspection{bookings.length !== 1 ? "s" : ""} booked
        </p>
      </div>

      {bookings.length === 0 && <EmptyBookings />}

      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} onSetDate={setActiveDateSheet} />
      ))}

      {activeDateSheet && (
        <SetDateSheet
          booking={activeDateSheet}
          onClose={() => setActiveDateSheet(null)}
          onSuccess={handleDateSuccess}
        />
      )}
    </div>
  );
}