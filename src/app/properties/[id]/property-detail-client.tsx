"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// ─── AMENITY / TYPE MAPS ──────────────────────────────────────────────────────

const AMENITY_MAP: Record<string, { icon: string; label: string }> = {
  "running-water":    { icon: "💧", label: "Running water" },
  "prepaid-meter":    { icon: "⚡", label: "Prepaid meter" },
  "band-a-light":     { icon: "🔆", label: "Band A light" },
  "band-b-light":     { icon: "💡", label: "Band B light" },
  "tiled-floors":     { icon: "🪟", label: "Tiled floors" },
  "ceiling-fan":      { icon: "🌀", label: "Ceiling fan" },
  "furnished":        { icon: "🛋️", label: "Furnished" },
  "kitchen":          { icon: "🍳", label: "Kitchen" },
  "bathroom-inside":  { icon: "🚿", label: "Bathroom inside" },
  "security-gate":    { icon: "🔒", label: "Security / Gate" },
  "parking-space":    { icon: "🚗", label: "Parking space" },
  "fence-compound":   { icon: "🏠", label: "Fence compound" },
  "good-road-access": { icon: "🛣️", label: "Good road access" },
  "close-to-nysc":    { icon: "📍", label: "Close to NYSC" },
  "good-network":     { icon: "📶", label: "Good network" },
};

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom Flat",
  "2-bed":     "2 Bedroom Flat",
  "room":      "Single Room",
};

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  available:          { bg: "#EAF3DE", color: "#27500A", dot: "#43A047" },
  reserved:           { bg: "#FAEEDA", color: "#633806", dot: "#F59E0B" },
  occupied:           { bg: "#FCEBEB", color: "#791F1F", dot: "#E53935" },
  "temp-unavailable": { bg: "#F3F4F6", color: "#4B5563", dot: "#9CA3AF" },
  "under-review":     { bg: "#EEF2FF", color: "#3730A3", dot: "#6366F1" },
};

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
  listingPurpose: string;
  images: string[] | null;
  amenities: string[] | null;
  customAmenities: string[] | null;
  createdAt: Date | string;
};

type Props = {
  listing:         Listing;
  agentName:       string;
  isLoggedIn:      boolean;
  isWatchlisted:   boolean;
  autoOpenBooking: boolean;
};

// ─── SET DATE SHEET (shown immediately after payment) ─────────────────────────

function SetDateSheet({
  bookingId,
  listingTitle,
  onClose,
  onSuccess,
}: {
  bookingId:    string;
  listingTitle: string;
  onClose:      () => void;
  onSuccess:    () => void;
}) {
  const [date, setDate]       = useState("");
  const [time, setTime]       = useState("");
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleSubmit() {
    if (!date || !time) {
      toast.error("Please select both a date and time");
      return;
    }

    const [h, m]    = time.split(":").map(Number);
    const ampm      = h >= 12 ? "PM" : "AM";
    const hour12    = h % 12 === 0 ? 12 : h % 12;
    const formatted = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/set-date", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId, agreedDate: date, agreedTime: formatted }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to set date");
      }

      toast.success("Visit scheduled! Check your bookings for agent details.");
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{
        position: "relative", background: "var(--color-card)",
        borderRadius: "22px 22px 0 0", padding: "8px 20px 40px",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "8px auto 20px" }} />

        {/* Success header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", borderRadius: 14,
          background: "#E8F5E9", border: "1px solid #C0DD97",
          marginBottom: 20,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#2E7D32", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, color: "#1B5E20", margin: 0 }}>
              Payment successful!
            </p>
            <p style={{ fontSize: 12, color: "#2E7D32", margin: 0 }}>
              Now schedule your visit to unlock agent contact
            </p>
          </div>
        </div>

        <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 6px" }}>
          Schedule your visit
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
          Pick when you want to inspect <strong>{listingTitle}</strong>. Agent phone and full address will be revealed immediately.
        </p>

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
            fontFamily: "var(--font-body)",
          }}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
          Preferred Time
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{
            width: "100%", padding: "13px 14px", borderRadius: 12,
            border: "1.5px solid var(--color-border)", fontSize: 14,
            color: "var(--color-text)", background: "var(--color-bg)",
            marginBottom: 24, boxSizing: "border-box",
            fontFamily: "var(--font-body)",
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !date || !time}
          style={{
            width: "100%", padding: "15px",
            background: loading || !date || !time ? "var(--color-border)" : "var(--color-primary)",
            color: "#fff", border: "none", borderRadius: 14,
            fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15,
            cursor: loading || !date || !time ? "not-allowed" : "pointer",
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
            fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15,
            cursor: "pointer",
          }}
        >
          I'll do this from My Bookings later
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PropertyDetailClient({
  listing,
  agentName,
  isLoggedIn,
  isWatchlisted,
  autoOpenBooking,
}: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [activeImage, setActiveImage]         = useState(0);
  const [watching, setWatching]               = useState(isWatchlisted);
  const [toggling, setToggling]               = useState(false);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(autoOpenBooking && isLoggedIn);
  const [payLoading, setPayLoading]           = useState(false);

  // After payment redirect
  const [verifying, setVerifying]             = useState(false);
  const [bookingId, setBookingId]             = useState<string | null>(null);
  const [showDateSheet, setShowDateSheet]     = useState(false);

  const images          = listing.images ?? [];
  const badge           = statusStyle[listing.status] ?? statusStyle.available;
  const isAvailable     = listing.status === "available";
  const isForSale       = listing.listingPurpose === "sale";
  const typeLabel       = TYPE_LABELS[listing.type] ?? listing.type;
  const allAmenities    = listing.amenities ?? [];
  const customAmenities = listing.customAmenities ?? [];

  // ── Handle Paystack redirect back ─────────────────────────────────────────
  // When Paystack redirects to /properties/[id]?payment=success&ref=CN-xxx
  // we verify the payment and open the set-date sheet
  const verifyPayment = useCallback(async (ref: string) => {
    setVerifying(true);
    try {
      const res  = await fetch(`/api/payments/verify/${ref}`);
      const data = await res.json();

      if (data.paid) {
        if (data.bookingId) {
          setBookingId(data.bookingId);
          setShowDateSheet(true);
        } else if (data.pending) {
          // Webhook not yet fired — poll once after 3s
          setTimeout(async () => {
            const res2  = await fetch(`/api/payments/verify/${ref}`);
            const data2 = await res2.json();
            if (data2.paid && data2.bookingId) {
              setBookingId(data2.bookingId);
              setShowDateSheet(true);
            } else {
              toast.success("Payment confirmed! Your booking will appear in My Bookings shortly.");
            }
            setVerifying(false);
          }, 3000);
          return;
        }
      } else {
        toast.error("Payment could not be verified. Contact support if you were charged.");
      }
    } catch {
      toast.error("Could not verify payment. Check My Bookings or contact support.");
    } finally {
      setVerifying(false);
    }
  }, []);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const ref           = searchParams.get("ref");

    if (paymentStatus === "success" && ref) {
      // Clean URL without reloading
      window.history.replaceState({}, "", `/properties/${listing.id}`);
      verifyPayment(ref);
    }
  }, [searchParams, listing.id, verifyPayment]);

  // Auto-redirect if not logged in
  useEffect(() => {
    if (autoOpenBooking && !isLoggedIn) {
      router.push(`/signin?callbackUrl=/properties/${listing.id}?action=book`);
    }
  }, [autoOpenBooking, isLoggedIn, router, listing.id]);

  // ── Initiate Paystack payment ─────────────────────────────────────────────
  async function handlePay() {
    if (payLoading) return;
    setPayLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listingId: listing.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not start payment. Try again.");
        return;
      }

      // Redirect to Paystack hosted payment page
      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPayLoading(false);
    }
  }

  function handleBookInspection() {
    if (!isLoggedIn) {
      router.push(`/signin?callbackUrl=/properties/${listing.id}?action=book`);
      return;
    }
    setBookingSheetOpen(true);
  }

  async function handleWatchlistToggle() {
    if (!isLoggedIn) {
      router.push(`/signin?callbackUrl=/properties/${listing.id}`);
      return;
    }
    if (toggling) return;
    setToggling(true);
    const newWatching = !watching;
    setWatching(newWatching);
    try {
      const res = await fetch("/api/watchlist/toggle", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listingId: listing.id }),
      });
      if (!res.ok) { setWatching(!newWatching); return; }
      toast(newWatching ? "Added to watchlist" : "Removed from watchlist", { duration: 2000 });
    } catch {
      setWatching(!newWatching);
      toast.error("Could not update watchlist. Try again.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
       <button onClick={() => router.back()}
  className="w-9 h-9 rounded-full flex items-center justify-center"
  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
</button>

<p className="text-sm font-semibold truncate flex-1 mx-3"
  style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
  {listing.title}
</p>

{/* Share */}
<button
  onClick={async () => {
    const url  = `https://www.corpernest.com.ng/properties/${listing.id}`;
    const text = `🏠 ${listing.title}\n📍 ${listing.lga}, ${listing.state}\n💰 ₦${listing.price.toLocaleString()}/yr\n\nVerified listing on CorperNest — inspect before you pay rent.`;
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, text, url }); } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`, "_blank");
    }
  }}
  className="w-9 h-9 rounded-full flex items-center justify-center"
  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", marginRight: 8 }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="18" cy="5"  r="3" stroke="var(--color-text)" strokeWidth="1.8" />
    <circle cx="6"  cy="12" r="3" stroke="var(--color-text)" strokeWidth="1.8" />
    <circle cx="18" cy="19" r="3" stroke="var(--color-text)" strokeWidth="1.8" />
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
      stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
</button>

{/* Watchlist */}
<button onClick={handleWatchlistToggle} disabled={toggling}
  className="w-9 h-9 rounded-full flex items-center justify-center"
  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={watching ? "#E53935" : "var(--color-text-muted)"}
      strokeWidth="1.8"
      fill={watching ? "#E53935" : "none"}
    />
  </svg>
</button>
      </div>

      {/* ── VERIFYING OVERLAY ── */}
      {verifying && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            border: "3px solid var(--color-primary)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15 }}>
            Verifying payment…
          </p>
        </div>
      )}

      {/* ── IMAGE GALLERY ── */}
      <div className="relative" style={{ height: "280px" }}>
        {images.length > 0 ? (
          <>
            <img
              src={images[activeImage]}
              alt={`${listing.title} photo ${activeImage + 1}`}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}>
              {activeImage + 1} / {images.length}
            </span>
            {images.length > 1 && (
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className="rounded-lg overflow-hidden shrink-0"
                    style={{
                      width: "44px", height: "44px",
                      border: i === activeImage ? "2px solid #fff" : "2px solid rgba(255,255,255,0.3)",
                    }}>
                    <img src={images[i]} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#E8F5E9" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#7A9A7A" strokeWidth="1.4" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#7A9A7A" strokeWidth="1.4" />
              <path d="M21 15l-5-5L5 21" stroke="#7A9A7A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* Title + badges */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-lg font-bold flex-1"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {listing.title}
            </h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg shrink-0"
              style={{ backgroundColor: "var(--color-light)", color: "var(--color-primary)", border: "1px solid var(--color-border)" }}>
              {typeLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
              style={{ backgroundColor: badge.bg, color: badge.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
              {listing.status.replace(/-/g, " ")}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: isForSale ? "#FEF3C7" : "#E8F5E9", color: isForSale ? "#92400E" : "#1B5E20" }}>
              {isForSale ? "For Sale" : "For Rent"}
            </span>
          </div>
        </div>

        {/* Price card */}
        <div className="rounded-2xl p-4 flex items-center justify-between"
          style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>
              {isForSale ? "Selling price" : "Annual rent"}
            </p>
            <p className="text-2xl font-black"
              style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
              ₦{listing.price.toLocaleString()}
              <span className="text-sm font-normal opacity-70 ml-1">
                {isForSale ? "one-time" : "/yr"}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Listed by</p>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {agentName}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              🔒 Contact after booking
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
            Location
          </p>
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="var(--color-primary)" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="3" stroke="var(--color-primary)" strokeWidth="1.8" />
            </svg>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {listing.lga}, {listing.state}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.8" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Full address unlocked after booking
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
            About this property
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {listing.description}
          </p>
        </div>

        {/* Amenities */}
        {(allAmenities.length > 0 || customAmenities.length > 0) && (
          <div className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
              Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {allAmenities.map((slug) => {
                const amenity = AMENITY_MAP[slug];
                if (!amenity) return null;
                return (
                  <span key={slug} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
                    <span>{amenity.icon}</span>
                    {amenity.label}
                  </span>
                );
              })}
              {customAmenities.map((a, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                  ✦ {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Inspection fee notice */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#EAF3DE", border: "1px solid #C0DD97" }}>
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke="#27500A" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="#27500A" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#27500A", fontFamily: "var(--font-heading)" }}>
                One inspection fee covers all
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#3B6D11" }}>
                Pay a flat ₦5,000 inspection fee to unlock this agent's contact and tour all their properties in one visit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FIXED BOTTOM CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 z-40"
        style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-border)" }}>
        <div className="max-w-2xl mx-auto">
          {isAvailable ? (
            <button
              onClick={handleBookInspection}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
              Book Inspection — ₦5,000
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl text-center font-semibold text-sm"
              style={{ backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              This property is currently {listing.status.replace(/-/g, " ")}
            </div>
          )}
        </div>
      </div>

      {/* ── BOOKING BOTTOM SHEET ── */}
      {bookingSheetOpen && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setBookingSheetOpen(false)} />
      )}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl"
        style={{
          backgroundColor: "var(--color-card)",
          transform:    bookingSheetOpen ? "translateY(0)" : "translateY(100%)",
          transition:   "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          maxWidth:     "672px",
          margin:       "0 auto",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
        </div>
        <div className="px-5 pt-3 pb-6">
          <p className="text-base font-bold mb-1"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            Book Inspection
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
            Pay ₦5,000 to unlock agent contact and schedule a visit.
          </p>

          {/* What you get */}
          <div className="rounded-2xl p-4 mb-5 space-y-2"
            style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            {[
              "Agent's phone number revealed",
              "Full property address unlocked",
              "Tour all properties by this agent",
              "Secure visit verification on arrival",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{item}</p>
              </div>
            ))}
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={payLoading}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mb-3"
            style={{
              backgroundColor: payLoading ? "var(--color-border)" : "var(--color-primary)",
              fontFamily: "var(--font-heading)",
              cursor: payLoading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {payLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Starting payment…
              </>
            ) : (
              <>
                Pay ₦5,000 securely
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>

          {/* Paystack trust badge */}
          <p className="text-center text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
            🔒 Secured by Paystack · Your card is never stored
          </p>

          <button
            onClick={() => setBookingSheetOpen(false)}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            Cancel
          </button>
        </div>
      </div>

      {/* ── SET DATE SHEET (shown after successful payment) ── */}
      {showDateSheet && bookingId && (
        <SetDateSheet
          bookingId={bookingId}
          listingTitle={listing.title}
          onClose={() => {
            setShowDateSheet(false);
            router.push("/bookings");
          }}
          onSuccess={() => {
            setShowDateSheet(false);
            router.push("/bookings");
          }}
        />
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}