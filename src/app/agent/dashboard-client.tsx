"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

type PendingBooking = {
  id: string;
  bookingCode: string;
  status: string;
  visitDate: Date | null;
  listingId: string;
  renterId: string;
};

type Props = {
  agentName: string;
  listings: Listing[];
  pendingBookings: PendingBooking[];
  expiringListings: Listing[];
  staleListings: Listing[];
  completedCount: number;
};

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "temp-unavailable", label: "Temp unavailable" },
];

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  available:        { bg: "#EAF3DE", color: "#27500A", dot: "#43A047" },
  occupied:         { bg: "#FCEBEB", color: "#791F1F", dot: "#E53935" },
  "temp-unavailable": { bg: "#F3F4F6", color: "#4B5563", dot: "#9CA3AF" },
  "under-review":   { bg: "#EEF2FF", color: "#3730A3", dot: "#6366F1" },
};

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

type VerifyState = {
  step: "idle" | "code-sent" | "confirming" | "error";
  maskedEmail?: string;
  errorMessage?: string;
};

export default function AgentDashboardClient({
  agentName,
  listings,
  pendingBookings,
  expiringListings,
  staleListings,
  completedCount,
}: Props) {
  const router = useRouter();

  const [statusMap, setStatusMap] = useState<Record<string, string>>(
    Object.fromEntries(listings.map((l) => [l.id, l.status]))
  );
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Bottom sheet state: which listing's sheet is open
  const [sheetListingId, setSheetListingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [verifyStates, setVerifyStates] = useState<Record<string, VerifyState>>(
    Object.fromEntries(pendingBookings.map((b) => [b.id, { step: "idle" }]))
  );
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>(
    Object.fromEntries(pendingBookings.map((b) => [b.id, ""]))
  );

  const initial = agentName ? agentName.charAt(0).toUpperCase() : "A";

  function setVerifyState(bookingId: string, state: VerifyState) {
    setVerifyStates((prev) => ({ ...prev, [bookingId]: state }));
  }
  function setCodeInput(bookingId: string, value: string) {
    setCodeInputs((prev) => ({ ...prev, [bookingId]: value.toUpperCase().trim() }));
  }

  async function handleDelete(listingId: string, mode: "temporary" | "permanent") {
    setSheetListingId(null);
    setDeletingId(listingId);
    try {
      const res = await fetch("/api/properties/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, mode }),
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

  async function handleSendCode(bookingId: string) {
    setVerifyState(bookingId, { step: "confirming" });
    try {
      const res = await fetch("/api/bookings/send-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyState(bookingId, { step: "error", errorMessage: data.error ?? "Failed to send code." });
        return;
      }
      setVerifyState(bookingId, { step: "code-sent", maskedEmail: data.maskedRenterEmail });
    } catch {
      setVerifyState(bookingId, { step: "error", errorMessage: "Network error." });
    }
  }

  async function handleConfirmCode(bookingId: string) {
    const code = codeInputs[bookingId];
    if (!code || code.length < 3) {
      setVerifyState(bookingId, { step: "code-sent", errorMessage: "Enter the code the renter received." });
      return;
    }
    setVerifyState(bookingId, { step: "confirming" });
    try {
      const res = await fetch("/api/bookings/confirm-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyState(bookingId, { step: "code-sent", errorMessage: data.error ?? "Invalid code." });
        return;
      }
      router.refresh();
    } catch {
      setVerifyState(bookingId, { step: "code-sent", errorMessage: "Network error." });
    }
  }

  async function handleStatusUpdate(listingId: string, newStatus: string) {
    setStatusMap((prev) => ({ ...prev, [listingId]: newStatus }));
    setUpdatingId(listingId);
    try {
      await fetch("/api/properties/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, status: newStatus }),
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleListings = listings.filter((l) => !deletedIds.has(l.id));
  const sheetListing = sheetListingId ? listings.find((l) => l.id === sheetListingId) : null;

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
            {pendingBookings.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: "#E53935" }} />
            )}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6 pb-10">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: pendingBookings.length, label: "Pending Visits", color: "#BA7517" },
            { num: visibleListings.length, label: "Listings", color: "#3B6D11" },
            { num: completedCount, label: "Completed", color: "var(--color-text-secondary)" },
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

        {/* ── PENDING VISITS ── */}
        <div>
          <p className="text-xs font-semibold uppercase mb-3 tracking-wide"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
            Pending Visits
          </p>
          {pendingBookings.length === 0 ? (
            <div className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No pending visits right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((b) => {
                const vs = verifyStates[b.id] ?? { step: "idle" };
                return (
                  <div key={b.id} className="rounded-2xl p-4"
                    style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: "#E8F5E9", color: "#2E7D32", fontFamily: "var(--font-heading)" }}>
                        {b.renterId.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Pending Visit</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                          {b.bookingCode}
                        </p>
                      </div>
                      {vs.step === "idle" && (
                        <button onClick={() => handleSendCode(b.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
                          style={{ backgroundColor: "#43A047", color: "#fff" }}>
                          Verify
                        </button>
                      )}
                      {vs.step === "confirming" && (
                        <div className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
                          style={{ borderColor: "#43A047", borderTopColor: "transparent" }} />
                      )}
                    </div>
                    {vs.step === "code-sent" && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                        <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                          Code sent to <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{vs.maskedEmail}</span>. Ask renter to read it out.
                        </p>
                        {vs.errorMessage && (
                          <p className="text-xs mb-2" style={{ color: "#E53935" }}>{vs.errorMessage}</p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={codeInputs[b.id] ?? ""}
                            onChange={(e) => setCodeInput(b.id, e.target.value)}
                            placeholder="CNV-XXXXXX"
                            maxLength={10}
                            className="flex-1 text-sm px-3 py-2 rounded-xl focus:outline-none"
                            style={{
                              border: "1px solid var(--color-border)",
                              backgroundColor: "var(--color-bg)",
                              color: "var(--color-text)",
                              fontFamily: "var(--font-mono)",
                              letterSpacing: "1px",
                            }}
                          />
                          <button onClick={() => handleConfirmCode(b.id)}
                            className="text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
                            style={{ backgroundColor: "#2E7D32", color: "#fff" }}>
                            Confirm
                          </button>
                        </div>
                        <button
                          onClick={() => { setCodeInput(b.id, ""); handleSendCode(b.id); }}
                          className="text-xs mt-2 underline underline-offset-2"
                          style={{ color: "var(--color-text-muted)" }}>
                          Resend code
                        </button>
                      </div>
                    )}
                    {vs.step === "error" && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                        <p className="text-xs mb-2" style={{ color: "#E53935" }}>{vs.errorMessage}</p>
                        <button onClick={() => handleSendCode(b.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: "#43A047", color: "#fff" }}>
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
                const badge = statusStyle[currentStatus] ?? statusStyle.available;
                const coverImage = l.images?.[0] ?? null;
                const isDeleting = deletingId === l.id;

                return (
                  <div key={l.id} className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      opacity: isDeleting ? 0.5 : 1,
                      transition: "opacity 0.2s",
                    }}>

                    {/* ── COVER IMAGE ── */}
                    <div className="relative w-full" style={{ height: "180px" }}>
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={l.title}
                          className="w-full h-full object-cover"
                        />
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

                      {/* Gradient overlay at bottom for text legibility */}
                      <div className="absolute inset-0"
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.55) 100%)" }} />

                      {/* Status badge — top left */}
                      <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: badge.bg, color: badge.color }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                          style={{ backgroundColor: badge.dot }} />
                        {currentStatus.replace(/-/g, " ")}
                      </span>

                      {/* ⋯ menu button — top right */}
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

                      {/* Price over image — bottom left */}
                      <p className="absolute bottom-3 left-3 text-sm font-bold"
                        style={{ color: "#fff", fontFamily: "var(--font-heading)", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                        ₦{l.price.toLocaleString()}<span className="text-xs font-normal opacity-80">/yr</span>
                      </p>
                    </div>

                    {/* ── LISTING INFO ── */}
                    <div className="px-4 pt-3 pb-4">
                      <p className="text-sm font-semibold"
                        style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                        {l.title}
                      </p>
                      <p className="text-xs mt-0.5 mb-3"
                        style={{ color: "var(--color-text-muted)" }}>
                        {l.lga}, {l.state}
                      </p>

                      {/* Status update select */}
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
                            border: "1px solid var(--color-border)",
                            backgroundColor: "var(--color-bg)",
                            color: "var(--color-text)",
                            maxWidth: "180px",
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
          transform: sheetListingId ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          maxWidth: "672px",
          margin: "0 auto",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
        </div>

        {/* Sheet title */}
        <div className="px-5 pt-2 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            {sheetListing?.title ?? "Listing"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Choose an action
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 space-y-2">

          {/* Hide temporarily — soft delete, agent can restore */}
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

          {/* Delete permanently */}
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

          {/* Cancel */}
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