"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  "under-review":     { bg: "#EEF2FF", color: "#3730A3", dot: "#6366F1" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function daysAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function daysUntilExpiry(date: Date) {
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + 7);
  const diff = expiry.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-NG", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}

// ─── INCOMING BOOKING CARD ────────────────────────────────────────────────────

function IncomingBookingCard({ booking }: { booking: IncomingBooking }) {
  const isScheduled = booking.status === "scheduled";
  const initial     = booking.renterName?.charAt(0).toUpperCase() ?? "C";

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
    >
      {/* Corper info row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#E8F5E9", color: "#2E7D32", fontFamily: "var(--font-heading)" }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            {booking.renterName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            {booking.bookingCode}
          </p>
        </div>
        {/* Status pill */}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
          style={
            isScheduled
              ? { backgroundColor: "#E8F5E9", color: "#2E7D32" }
              : { backgroundColor: "#FFF8E1", color: "#F59E0B" }
          }
        >
          {isScheduled ? "Scheduled" : "Awaiting date"}
        </span>
      </div>

      <div style={{ height: 1, background: "var(--color-border)", marginBottom: 12 }} />

      {/* Visit date — shown when corper has scheduled */}
      {isScheduled && booking.agreedDate ? (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3"
          style={{ backgroundColor: "#E8F5E9", border: "1px solid var(--color-border)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="#2E7D32" strokeWidth="1.8" />
            <path d="M16 2V6M8 2V6M3 10H21" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p className="text-xs font-semibold" style={{ color: "#2E7D32" }}>
            Visit: {formatDate(booking.agreedDate)}{booking.agreedTime ? ` · ${booking.agreedTime}` : ""}
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl px-3 py-2.5 mb-3"
          style={{ backgroundColor: "#FFF8E1", border: "1px solid #FDE68A" }}
        >
          <p className="text-xs" style={{ color: "#92400E" }}>
            Corper hasn't scheduled a visit date yet.
          </p>
        </div>
      )}

      {/* Corper contact */}
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs font-semibold uppercase mb-2"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
          Corper Contact
        </p>
        {booking.renterPhone && (
          <a
            href={`tel:${booking.renterPhone}`}
            className="flex items-center gap-2 mb-1"
            style={{ color: "var(--color-primary)", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                stroke="currentColor" strokeWidth="1.8" fill="none" />
            </svg>
            {booking.renterPhone}
          </a>
        )}
        <a
          href={`mailto:${booking.renterEmail}`}
          style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: 12 }}
        >
          {booking.renterEmail}
        </a>
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

  const [statusMap, setStatusMap] = useState<Record<string, string>>(
    Object.fromEntries(listings.map((l) => [l.id, l.status]))
  );
  const [deletedIds, setDeletedIds]   = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [sheetListingId, setSheetListingId] = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  // suppress unused warning — router used for potential future refresh
  void router;

  const initial = agentName ? agentName.charAt(0).toUpperCase() : "A";

  async function handleDelete(listingId: string, mode: "temporary" | "permanent") {
    setSheetListingId(null);
    setDeletingId(listingId);
    try {
      const res  = await fetch("/api/properties/delete", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listingId, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed. Try again.");
        setDeletingId(null);
        return;
      }
      if (mode === "permanent") {
        setDeletedIds((prev) => new Set([...prev, listingId]));
      } else {
        setStatusMap((prev) => ({ ...prev, [listingId]: "temp-unavailable" }));
      }
    } catch {
      alert("Network error. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusUpdate(listingId: string, newStatus: string) {
    setStatusMap((prev) => ({ ...prev, [listingId]: newStatus }));
    setUpdatingId(listingId);
    try {
      await fetch("/api/properties/update-status", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listingId, status: newStatus }),
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleListings = listings.filter((l) => !deletedIds.has(l.id));
  const sheetListing    = sheetListingId ? listings.find((l) => l.id === sheetListingId) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ── DARK HEADER ── */}
      <header className="sticky top-0 z-50 px-4 py-4" style={{ backgroundColor: "#1B2E1B" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ backgroundColor: "#2E7D32", border: "2px solid #43A047", color: "#E8F5E9", fontFamily: "var(--font-heading)" }}
            >
              {initial}
            </div>
            <div>
              <p className="text-xs" style={{ color: "#7A9A7A", letterSpacing: "0.5px" }}>WELCOME BACK, AGENT</p>
              <p className="text-sm font-semibold" style={{ color: "#E8F5E9", fontFamily: "var(--font-heading)" }}>
                {agentName}
              </p>
            </div>
          </div>
          <button
            className="relative w-9 h-9 rounded-full flex items-center justify-center"
            style={{ border: "1px solid #2E7D32" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#C8E6C9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {incomingBookings.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: "#E53935" }} />
            )}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6 pb-10">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: incomingBookings.length, label: "Incoming",  color: "#BA7517" },
            { num: visibleListings.length,  label: "Listings",  color: "#3B6D11" },
            { num: completedCount,          label: "Completed", color: "var(--color-text-secondary)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl p-3 text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "var(--font-heading)" }}>
                {stat.num}
              </p>
              <p className="text-xs mt-0.5 leading-tight" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── AVAILABILITY REMINDER ── */}
        {staleListings.filter((l) => !deletedIds.has(l.id)).length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#EAF3DE", border: "1px solid #C0DD97" }}>
            <div className="flex items-center gap-2 mb-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#27500A" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="#27500A" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-semibold" style={{ color: "#27500A", fontFamily: "var(--font-heading)" }}>
                Availability reminder
              </p>
            </div>
            <p className="text-xs mb-3" style={{ color: "#3B6D11", lineHeight: 1.5 }}>
              {staleListings.filter((l) => !deletedIds.has(l.id)).length} listing
              {staleListings.filter((l) => !deletedIds.has(l.id)).length > 1 ? "s haven't" : " hasn't"} been updated in 5+ days.
            </p>
            <div className="space-y-2">
              {staleListings.filter((l) => !deletedIds.has(l.id)).map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <span className="text-xs flex-1 truncate" style={{ color: "#27500A" }}>{l.title}</span>
                  <select
                    value={statusMap[l.id] ?? l.status}
                    onChange={(e) => handleStatusUpdate(l.id, e.target.value)}
                    disabled={updatingId === l.id}
                    className="text-xs px-2 py-1.5 rounded-lg"
                    style={{ border: "1px solid #97C459", backgroundColor: "#fff", color: "#27500A", maxWidth: "145px" }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INCOMING BOOKINGS ── */}
        <div>
          <p className="text-xs font-semibold uppercase mb-3 tracking-wide"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
            Incoming Bookings
          </p>
          {incomingBookings.length === 0 ? (
            <div className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No incoming bookings right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingBookings.map((b) => (
                <IncomingBookingCard key={b.id} booking={b} />
              ))}
            </div>
          )}
        </div>

        {/* ── MY LISTINGS ── */}
        <div>
          <p className="text-xs font-semibold uppercase mb-3 tracking-wide"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
            My Listings
          </p>

          {visibleListings.length === 0 ? (
            <div className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm mb-1 font-medium" style={{ color: "var(--color-text)" }}>No listings yet</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Add your first listing to start getting bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleListings.map((l) => {
                const currentStatus = statusMap[l.id] ?? l.status;
                const badge         = statusStyle[currentStatus] ?? statusStyle.available;
                const coverImage    = l.images?.[0] ?? null;
                const isDeleting    = deletingId === l.id;

                return (
                  <div key={l.id} className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--color-card)",
                      border:     "1px solid var(--color-border)",
                      opacity:    isDeleting ? 0.5 : 1,
                      transition: "opacity 0.2s",
                    }}>

                    {/* Cover image */}
                    <div className="relative w-full" style={{ height: "180px" }}>
                      {coverImage ? (
                        <img src={coverImage} alt={l.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: "#E8F5E9" }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="#7A9A7A" strokeWidth="1.4" />
                            <circle cx="8.5" cy="8.5" r="1.5" stroke="#7A9A7A" strokeWidth="1.4" />
                            <path d="M21 15l-5-5L5 21" stroke="#7A9A7A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0"
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.55) 100%)" }} />

                      {/* Status badge */}
                      <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: badge.bg, color: badge.color }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                          style={{ backgroundColor: badge.dot }} />
                        {currentStatus.replace(/-/g, " ")}
                      </span>

                      {/* Menu button */}
                      <button
                        onClick={() => setSheetListingId(l.id)}
                        disabled={isDeleting}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                      >
                        {isDeleting ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="5" cy="12" r="1.5" fill="white" />
                            <circle cx="12" cy="12" r="1.5" fill="white" />
                            <circle cx="19" cy="12" r="1.5" fill="white" />
                          </svg>
                        )}
                      </button>

                      {/* Price */}
                      <p className="absolute bottom-3 left-3 text-sm font-bold"
                        style={{ color: "#fff", fontFamily: "var(--font-heading)", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                        ₦{l.price.toLocaleString()}<span className="text-xs font-normal opacity-80">/yr</span>
                      </p>
                    </div>

                    {/* Listing info */}
                    <div className="px-4 pt-3 pb-4">
                      <p className="text-sm font-semibold"
                        style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                        {l.title}
                      </p>
                      <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--color-text-muted)" }}>
                        {l.lga}, {l.state}
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                          Update status:
                        </label>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusUpdate(l.id, e.target.value)}
                          disabled={updatingId === l.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg flex-1 disabled:opacity-50"
                          style={{
                            border:          "1px solid var(--color-border)",
                            backgroundColor: "var(--color-bg)",
                            color:           "var(--color-text)",
                            maxWidth:        "180px",
                          }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        {updatingId === l.id && (
                          <span className="w-3.5 h-3.5 rounded-full border-2 animate-spin shrink-0"
                            style={{ borderColor: "#43A047", borderTopColor: "transparent" }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── EXPIRING SOON ── */}
        {expiringListings.filter((l) => !deletedIds.has(l.id)).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-3 tracking-wide"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
              Listings expiring soon
            </p>
            <div className="space-y-2">
              {expiringListings.filter((l) => !deletedIds.has(l.id)).map((l) => {
                const days = daysUntilExpiry(l.lastStatusUpdate);
                return (
                  <div key={l.id} className="flex items-center gap-3 rounded-2xl p-3.5"
                    style={{ backgroundColor: "#FAEEDA", border: "1px solid #FAC775" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <circle cx="12" cy="12" r="10" stroke="#854F0B" strokeWidth="1.8" />
                      <path d="M12 7v5l3 3" stroke="#854F0B" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#633806" }}>{l.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#854F0B" }}>
                        Last updated {daysAgo(l.lastStatusUpdate)} days ago
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
                      style={{ backgroundColor: "#fff", color: "#854F0B" }}>
                      {days === 0 ? "Today" : `${days}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ADD NEW LISTING CTA ── */}
        <Link
          href="/agent/listings/new"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold text-white"
          style={{ backgroundColor: "#2E7D32", fontFamily: "var(--font-heading)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Add new listing
        </Link>

      </div>

      {/* ── BOTTOM SHEET BACKDROP ── */}
      {sheetListingId && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setSheetListingId(null)}
        />
      )}

      {/* ── BOTTOM SHEET ── */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl"
        style={{
          backgroundColor: "var(--color-card)",
          transform:        sheetListingId ? "translateY(0)" : "translateY(100%)",
          transition:       "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          maxWidth:         "672px",
          margin:           "0 auto",
          paddingBottom:    "env(safe-area-inset-bottom, 16px)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
        </div>
        <div className="px-5 pt-2 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            {sheetListing?.title ?? "Listing"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Choose an action</p>
        </div>
        <div className="px-4 py-3 space-y-2">
          <button
            onClick={() => sheetListingId && handleDelete(sheetListingId, "temporary")}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left"
            style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#F3F4F6" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"
                  stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Hide temporarily</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Hidden from renters. You can restore it anytime.
              </p>
            </div>
          </button>
          <button
            onClick={() => sheetListingId && handleDelete(sheetListingId, "permanent")}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left"
            style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#FEE2E2" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#C62828" }}>Delete permanently</p>
              <p className="text-xs mt-0.5" style={{ color: "#E57373" }}>
                Removes listing and all photos. Cannot be undone.
              </p>
            </div>
          </button>
          <button
            onClick={() => setSheetListingId(null)}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
          >
            Cancel
          </button>
        </div>
      </div>

    </div>
  );
}