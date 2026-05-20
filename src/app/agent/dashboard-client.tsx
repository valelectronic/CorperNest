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
  { value: "reserved", label: "Reserved" },
  { value: "occupied", label: "Occupied" },
  { value: "temp-unavailable", label: "Temp unavailable" },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  available: { bg: "#EAF3DE", color: "#27500A" },
  reserved: { bg: "#FAEEDA", color: "#633806" },
  occupied: { bg: "#FCEBEB", color: "#791F1F" },
  "temp-unavailable": { bg: "#F3F4F6", color: "#4B5563" },
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
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

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

  // Step 1 — send OTP to renter
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
        setVerifyState(bookingId, {
          step: "error",
          errorMessage: data.error ?? "Failed to send code. Try again.",
        });
        return;
      }
      setVerifyState(bookingId, {
        step: "code-sent",
        maskedEmail: data.maskedRenterEmail,
      });
    } catch {
      setVerifyState(bookingId, {
        step: "error",
        errorMessage: "Network error. Check your connection.",
      });
    }
  }

  // Step 2 — confirm code renter reads out
  async function handleConfirmCode(bookingId: string) {
    const code = codeInputs[bookingId];
    if (!code || code.length < 3) {
      setVerifyState(bookingId, {
        step: "code-sent",
        errorMessage: "Enter the code the renter received.",
      });
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
        setVerifyState(bookingId, {
          step: "code-sent",
          errorMessage: data.error ?? "Invalid code. Ask renter to check again.",
        });
        return;
      }
      router.refresh();
    } catch {
      setVerifyState(bookingId, {
        step: "code-sent",
        errorMessage: "Network error. Try again.",
      });
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
              <p className="text-xs" style={{ color: "#7A9A7A", letterSpacing: "0.5px" }}>
                WELCOME BACK, AGENT
              </p>
              <p className="text-sm font-semibold" style={{ color: "#E8F5E9", fontFamily: "var(--font-heading)" }}>
                {agentName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center"
            style={{ border: "1px solid #2E7D32", backgroundColor: "transparent" }}
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

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: pendingBookings.length, label: "Pending Visits", color: "#BA7517" },
            { num: listings.length, label: "Listings", color: "#3B6D11" },
            { num: completedCount, label: "Completed", color: "var(--color-text-secondary)" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-3 text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "var(--font-heading)" }}>
                {stat.num}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── AVAILABILITY REMINDER ── */}
        {staleListings.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: "#EAF3DE", border: "1px solid #C0DD97" }}>
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#27500A" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="#27500A" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-semibold" style={{ color: "#27500A", fontFamily: "var(--font-heading)" }}>
                Availability reminder
              </p>
            </div>
            <p className="text-xs mb-3" style={{ color: "#3B6D11", lineHeight: 1.5 }}>
              {staleListings.length} listing{staleListings.length > 1 ? "s" : ""} haven't been updated in 5+ days.
            </p>
            <div className="space-y-2">
              {staleListings.map((l) => (
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
            <div className="rounded-xl p-6 text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No pending visits right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((b) => {
                const vs = verifyStates[b.id] ?? { step: "idle" };
                const isConfirming = vs.step === "confirming";

                return (
                  <div key={b.id} className="rounded-xl p-4"
                    style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

                    {/* Booking row */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                        style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}>
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

                      {isConfirming && (
                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                          style={{ borderColor: "#43A047", borderTopColor: "transparent" }} />
                      )}
                    </div>

                    {/* Step 2 — code input */}
                    {vs.step === "code-sent" && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                        <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                          Code sent to{" "}
                          <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{vs.maskedEmail}</span>.
                          Ask the renter to read it out.
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
                            className="flex-1 text-sm px-3 py-2 rounded-lg focus:outline-none"
                            style={{
                              border: "1px solid var(--color-border)",
                              backgroundColor: "var(--color-bg)",
                              color: "var(--color-text)",
                              fontFamily: "var(--font-mono)",
                              letterSpacing: "1px",
                            }}
                          />
                          <button
                            onClick={() => handleConfirmCode(b.id)}
                            className="text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
                            style={{ backgroundColor: "#2E7D32", color: "#fff" }}
                          >
                            Confirm
                          </button>
                        </div>

                        <button
                          onClick={() => { setCodeInput(b.id, ""); handleSendCode(b.id); }}
                          className="text-xs mt-2"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Resend code
                        </button>
                      </div>
                    )}

                    {/* Error state */}
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

          {listings.length === 0 ? (
            <div className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm mb-1 font-medium" style={{ color: "var(--color-text)" }}>No listings yet</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Add your first listing to start getting bookings
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((l) => {
                const style = statusStyle[statusMap[l.id] ?? l.status] ?? statusStyle.available;
                return (
                  <div key={l.id} className="rounded-xl p-4"
                    style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#E8F5E9" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="7" width="20" height="15" rx="2" stroke="#2E7D32" strokeWidth="1.8" />
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#2E7D32" strokeWidth="1.8" />
                          <path d="M12 12v4M10 14h4" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate"
                          style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                          {l.title}
                        </p>
                        <p className="text-xs mt-0.5 line-clamp-2"
                          style={{ color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                          {l.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: style.bg, color: style.color }}>
                        {(statusMap[l.id] ?? l.status).replace("-", " ")}
                      </span>
                      <select
                        value={statusMap[l.id] ?? l.status}
                        onChange={(e) => handleStatusUpdate(l.id, e.target.value)}
                        disabled={updatingId === l.id}
                        className="text-xs px-2 py-1.5 rounded-lg flex-1 min-w-0 disabled:opacity-50"
                        style={{
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-bg)",
                          color: "var(--color-text)",
                          maxWidth: "160px",
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      {updatingId === l.id && (
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Saving...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── EXPIRING SOON ── */}
        {expiringListings.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase mb-3 tracking-wide"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
              Listings expiring soon
            </p>
            <div className="space-y-2">
              {expiringListings.map((l) => {
                const days = daysUntilExpiry(l.lastStatusUpdate);
                return (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl p-3.5"
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

        {/* ── ADD NEW LISTING ── */}
        <Link
          href="/agent/listings/new"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#2E7D32", fontFamily: "var(--font-heading)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add new listing
        </Link>

      </div>
    </div>
  );
}