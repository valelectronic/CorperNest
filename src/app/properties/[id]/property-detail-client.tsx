"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  "3-bed":     "3 Bedroom Flat",
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
  id:              string;
  slug?:           string | null;   // ← ADDED
  title:           string;
  description:     string;
  address:         string;
  lga:             string;
  state:           string;
  price:           number;
  type:            string;
  status:          string;
  listingPurpose:  string;
  images:          string[] | null;
  amenities:       string[] | null;
  customAmenities: string[] | null;
  createdAt:       Date | string;
  landmark?:       string | null;
  agencyFeePercent?: number | null;
};

type Props = {
  listing:         Listing;
  agentName:       string;
  isLoggedIn:      boolean;
  isWatchlisted:   boolean;
  autoOpenBooking: boolean;
};

// ─── FULLSCREEN ZOOM VIEWER ───────────────────────────────────────────────────

function ZoomViewer({
  images, startIndex, onClose,
}: {
  images: string[]; startIndex: number; onClose: () => void;
}) {
  const [index, setIndex]   = useState(startIndex);
  const [scale, setScale]   = useState(1);
  const lastTapRef          = useRef(0);

  function next(e?: React.MouseEvent) {
    e?.stopPropagation();
    setScale(1);
    setIndex((prev) => (prev + 1) % images.length);
  }
  function prev(e?: React.MouseEvent) {
    e?.stopPropagation();
    setScale(1);
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  function handleImageTap(e: React.MouseEvent) {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setScale((prev) => (prev === 1 ? 2.2 : 1));
    }
    lastTapRef.current = now;
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column" }}
      onClick={onClose}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20 }}>
          {index + 1} / {images.length}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
        <img
          src={images[index]}
          alt={`Photo ${index + 1}`}
          onClick={handleImageTap}
          style={{
            maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
            transform: `scale(${scale})`, transition: "transform 0.25s ease",
            cursor: scale === 1 ? "zoom-in" : "zoom-out",
          }}
        />

        {images.length > 1 && (
          <>
            <button onClick={prev}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={next}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div style={{ flexShrink: 0, padding: "8px 16px 20px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 12px" }}>
          Double-tap image to zoom
        </p>
        {images.length > 1 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", justifyContent: "center" }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setScale(1); setIndex(i); }}
                style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: i === index ? "2px solid #fff" : "2px solid rgba(255,255,255,0.25)", cursor: "pointer", padding: 0 }}
              >
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SET DATE SHEET ───────────────────────────────────────────────────────────

function SetDateSheet({
  bookingId, listingTitle, onClose, onSuccess,
}: {
  bookingId: string; listingTitle: string; onClose: () => void; onSuccess: () => void;
}) {
  const [date, setDate]       = useState("");
  const [time, setTime]       = useState("");
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleSubmit() {
    if (!date || !time) { toast.error("Please select both a date and time"); return; }
    const [h, m] = time.split(":").map(Number);
    const ampm   = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const formatted = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/set-date", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, agreedDate: date, agreedTime: formatted }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Failed to set date"); }
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
      <div style={{ position: "relative", background: "var(--color-card)", borderRadius: "22px 22px 0 0", padding: "8px 20px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "8px auto 20px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "#E8F5E9", border: "1px solid #C0DD97", marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, color: "#1B5E20", margin: 0 }}>Payment successful!</p>
            <p style={{ fontSize: 12, color: "#2E7D32", margin: 0 }}>Now schedule your visit to unlock agent contact</p>
          </div>
        </div>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 6px" }}>Schedule your visit</p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
          Pick when you want to inspect <strong>{listingTitle}</strong>. Agent phone and full address will be revealed immediately.
        </p>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Visit Date</label>
        <input type="date" value={date} min={minDate} onChange={(e) => setDate(e.target.value)}
          style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", marginBottom: 16, boxSizing: "border-box", fontFamily: "var(--font-body)" }} />
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Preferred Time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
          style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", marginBottom: 24, boxSizing: "border-box", fontFamily: "var(--font-body)" }} />
        <button onClick={handleSubmit} disabled={loading || !date || !time}
          style={{ width: "100%", padding: "15px", background: loading || !date || !time ? "var(--color-border)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading || !date || !time ? "not-allowed" : "pointer", marginBottom: 10 }}>
          {loading ? "Scheduling…" : "Confirm Visit Date"}
        </button>
        <button onClick={onClose}
          style={{ width: "100%", padding: "15px", background: "var(--color-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
          I'll do this from My Bookings later
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PropertyDetailClient({
  listing, agentName, isLoggedIn, isWatchlisted, autoOpenBooking,
}: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Use slug for all URLs when available, fall back to raw id for older listings ← ADDED
  const linkPath = listing.slug ?? listing.id;

  const [activeImage,       setActiveImage]       = useState(0);
  const [watching,          setWatching]          = useState(isWatchlisted);
  const [toggling,          setToggling]          = useState(false);
  const [bookingSheetOpen,  setBookingSheetOpen]  = useState(autoOpenBooking && isLoggedIn);
  const [payLoading,        setPayLoading]        = useState(false);
  const [verifying,         setVerifying]         = useState(false);
  const [bookingId,         setBookingId]         = useState<string | null>(null);
  const [showDateSheet,     setShowDateSheet]     = useState(false);
  const [isPaused,          setIsPaused]          = useState(false);
  const [zoomOpen,          setZoomOpen]          = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const images          = listing.images ?? [];
  const hasMultiple      = images.length > 1;
  const badge           = statusStyle[listing.status] ?? statusStyle.available;
  const isAvailable     = listing.status === "available";
  const isForSale       = listing.listingPurpose === "sale";
  const typeLabel       = TYPE_LABELS[listing.type] ?? listing.type;
  const allAmenities    = listing.amenities ?? [];
  const customAmenities = listing.customAmenities ?? [];

  const agencyFeeNaira = listing.agencyFeePercent && listing.price
    ? Math.round(listing.price * (listing.agencyFeePercent / 100))
    : null;

  useEffect(() => {
    if (!hasMultiple || isPaused || zoomOpen) return;
    intervalRef.current = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMultiple, isPaused, zoomOpen, images.length]);

  function pauseThenResume() {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 6000);
  }

  const verifyPayment = useCallback(async (ref: string) => {
    setVerifying(true);
    try {
      const res  = await fetch(`/api/payments/verify/${ref}`);
      const data = await res.json();
      if (data.paid) {
        if (data.bookingId) { setBookingId(data.bookingId); setShowDateSheet(true); }
        else if (data.pending) {
          setTimeout(async () => {
            const res2  = await fetch(`/api/payments/verify/${ref}`);
            const data2 = await res2.json();
            if (data2.paid && data2.bookingId) { setBookingId(data2.bookingId); setShowDateSheet(true); }
            else { toast.success("Payment confirmed! Your booking will appear in My Bookings shortly."); }
            setVerifying(false);
          }, 3000);
          return;
        }
      } else { toast.error("Payment could not be verified. Contact support if you were charged."); }
    } catch { toast.error("Could not verify payment. Check My Bookings or contact support."); }
    finally { setVerifying(false); }
  }, []);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const ref           = searchParams.get("ref");
    if (paymentStatus === "success" && ref) {
      window.history.replaceState({}, "", `/properties/${linkPath}`);
      verifyPayment(ref);
    }
  }, [searchParams, linkPath, verifyPayment]);

  useEffect(() => {
    if (autoOpenBooking && !isLoggedIn) {
      router.push(`/signin?callbackUrl=/properties/${linkPath}?action=book`);
    }
  }, [autoOpenBooking, isLoggedIn, router, linkPath]);

  async function handlePay() {
    if (payLoading) return;
    setPayLoading(true);
    try {
      const res  = await fetch("/api/payments/initiate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not start payment. Try again."); return; }

      // Already paid this agent — booking was created directly, no Paystack needed
      if (data.alreadyPaid && data.bookingId) {
        toast.success("Already paid for this agent — booking created, no new charge!");
        setBookingId(data.bookingId);
        setShowDateSheet(true);
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch { toast.error("Network error. Please try again."); }
    finally { setPayLoading(false); }
  }

  function handleBookInspection() {
    if (!isLoggedIn) { router.push(`/signin?callbackUrl=/properties/${linkPath}?action=book`); return; }
    setBookingSheetOpen(true);
  }

  async function handleWatchlistToggle() {
    if (!isLoggedIn) { router.push(`/signin?callbackUrl=/properties/${linkPath}`); return; }
    if (toggling) return;
    setToggling(true);
    const newWatching = !watching;
    setWatching(newWatching);
    try {
      const res = await fetch("/api/watchlist/toggle", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (!res.ok) { setWatching(!newWatching); return; }
      toast(newWatching ? "Added to watchlist" : "Removed from watchlist", { duration: 2000 });
    } catch { setWatching(!newWatching); toast.error("Could not update watchlist. Try again."); }
    finally { setToggling(false); }
  }

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 120, backgroundColor: "var(--color-bg)" }}>

      {/* ── HEADER ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, color: "var(--color-text)", flex: 1, margin: "0 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {listing.title}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={async () => {
              const url       = `https://www.corpernest.com.ng/properties/${linkPath}`;
              const purpose   = isForSale ? "for sale" : "for rent";
              const text      =
                `🏠 ${listing.title}\n` +
                `${typeLabel} · 📍 ${listing.lga}, ${listing.state}\n` +
                `💰 ₦${listing.price.toLocaleString()}${isForSale ? "" : "/yr"} — ${purpose}\n\n` +
                `Verified listing on CorperNest — inspect before you pay rent. No scams, agent KYC-checked.`;
              if (navigator.share) { try { await navigator.share({ title: listing.title, text, url }); } catch {} }
              else { window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`, "_blank"); }
            }}
            style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5"  r="3" stroke="var(--color-text)" strokeWidth="1.8" />
              <circle cx="6"  cy="12" r="3" stroke="var(--color-text)" strokeWidth="1.8" />
              <circle cx="18" cy="19" r="3" stroke="var(--color-text)" strokeWidth="1.8" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button onClick={handleWatchlistToggle} disabled={toggling}
            style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke={watching ? "#E53935" : "var(--color-text-muted)"} strokeWidth="1.8" fill={watching ? "#E53935" : "none"} />
            </svg>
          </button>
        </div>
      </div>

      {/* ── VERIFYING OVERLAY ── */}
      {verifying && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid var(--color-primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15 }}>Verifying payment…</p>
        </div>
      )}

      {/* ── IMAGE GALLERY — auto-swap + tap to zoom ── */}
      <div
        style={{ position: "relative", height: 280, cursor: "zoom-in" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {images.length > 0 ? (
          <>
            <img
              src={images[activeImage]}
              alt={`${listing.title} photo ${activeImage + 1}`}
              onClick={() => setZoomOpen(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" }}
            />

            <div style={{ position: "absolute", top: 12, left: 12, width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="1.8" />
                <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>

            <span style={{ position: "absolute", bottom: 12, right: 12, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}>
              {activeImage + 1} / {images.length}
            </span>

            {hasMultiple && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p - 1 + images.length) % images.length); pauseThenResume(); }}
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p + 1) % images.length); pauseThenResume(); }}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}

            {images.length > 1 && (
              <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 6 }}>
                {images.map((_, i) => (
                  <button key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveImage(i); pauseThenResume(); }}
                    style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: i === activeImage ? "2px solid #fff" : "2px solid rgba(255,255,255,0.3)", cursor: "pointer", padding: 0 }}>
                    <img src={images[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#E8F5E9" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#7A9A7A" strokeWidth="1.4" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#7A9A7A" strokeWidth="1.4" />
              <path d="M21 15l-5-5L5 21" stroke="#7A9A7A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 672, margin: "0 auto", padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Title + badges */}
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: 0, flex: 1 }}>
              {listing.title}
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, backgroundColor: "var(--color-light)", color: "var(--color-primary)", border: "1px solid var(--color-border)", flexShrink: 0, whiteSpace: "nowrap" }}>
              {typeLabel}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, backgroundColor: badge.bg, color: badge.color, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: badge.dot }} />
              {listing.status.replace(/-/g, " ")}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, backgroundColor: isForSale ? "#FEF3C7" : "#E8F5E9", color: isForSale ? "#92400E" : "#1B5E20" }}>
              {isForSale ? "For Sale" : "For Rent"}
            </span>
          </div>
        </div>

        {/* Price card */}
        <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 3px" }}>
                {isForSale ? "Selling price" : "Annual rent"}
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 900, color: "var(--color-primary)", margin: 0, lineHeight: 1 }}>
                ₦{listing.price.toLocaleString()}
                <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.7, marginLeft: 4 }}>
                  {isForSale ? "one-time" : "/yr"}
                </span>
              </p>
              {agencyFeeNaira !== null && (
                <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "#FFF8E1", border: "1px solid #FAC775" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p style={{ fontSize: 12, color: "#B45309", margin: 0, fontWeight: 700 }}>
                    Agency fee: {listing.agencyFeePercent}% — ₦{agencyFeeNaira.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, maxWidth: "45%", minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 3px" }}>Listed by</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {agentName}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>🔒 Contact after booking</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 16 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Location
          </p>

          {listing.landmark && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--color-light)", border: "1px solid var(--color-border)", marginBottom: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="var(--color-primary)" strokeWidth="1.8" />
                <circle cx="12" cy="10" r="3" stroke="var(--color-primary)" strokeWidth="1.8" />
              </svg>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>
                  Nearest landmark
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-header)", margin: 0, lineHeight: 1.4 }}>
                  {listing.landmark}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="var(--color-text-muted)" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="3" stroke="var(--color-text-muted)" strokeWidth="1.8" />
            </svg>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)", margin: 0 }}>
              {listing.lga}, {listing.state}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.8" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
              Full address unlocked after booking
            </p>
          </div>
        </div>

        {/* Description */}
        <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 16 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
            About this property
          </p>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.7 }}>
            {listing.description}
          </p>
        </div>

        {/* Amenities */}
        {(allAmenities.length > 0 || customAmenities.length > 0) && (
          <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 16 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
              Amenities
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allAmenities.map((slug) => {
                const amenity = AMENITY_MAP[slug];
                if (!amenity) return null;
                return (
                  <span key={slug} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 20, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
                    <span>{amenity.icon}</span>
                    {amenity.label}
                  </span>
                );
              })}
              {customAmenities.map((a, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 20, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                  ✦ {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Inspection fee notice */}
        <div style={{ backgroundColor: "#EAF3DE", border: "1px solid #C0DD97", borderRadius: 20, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" stroke="#27500A" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="#27500A" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, color: "#27500A", margin: "0 0 4px" }}>
                One inspection fee covers all
              </p>
              <p style={{ fontSize: 13, color: "#3B6D11", margin: 0, lineHeight: 1.6 }}>
                Pay a flat ₦5,000 inspection fee to unlock this agent's contact and tour all their properties in one visit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FIXED BOTTOM CTA ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))", zIndex: 40, backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 672, margin: "0 auto" }}>
          {isAvailable ? (
            <button onClick={handleBookInspection}
              style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Book Inspection — ₦5,000
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div style={{ width: "100%", padding: "16px", borderRadius: 16, backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, textAlign: "center" }}>
              This property is currently {listing.status.replace(/-/g, " ")}
            </div>
          )}
        </div>
      </div>

      {/* ── BOOKING BOTTOM SHEET ── */}
      {bookingSheetOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setBookingSheetOpen(false)} />
      )}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        backgroundColor: "var(--color-card)", borderRadius: "22px 22px 0 0",
        transform: bookingSheetOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        maxWidth: 672, margin: "0 auto",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)" }} />
        </div>
        <div style={{ padding: "4px 20px 24px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
            Book Inspection
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px" }}>
            Pay ₦5,000 to unlock agent contact and schedule a visit.
          </p>

          <div style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "14px 16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Agent's phone number revealed",
              "Full property address unlocked",
              "Tour all properties by this agent",
              "Secure visit verification on arrival",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>

          <button onClick={handlePay} disabled={payLoading}
            style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: payLoading ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: payLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            {payLoading ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
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

          <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", margin: "0 0 10px" }}>
            🔒 Secured by Paystack · Your card is never stored
          </p>

          <button onClick={() => setBookingSheetOpen(false)}
            style={{ width: "100%", padding: "14px", borderRadius: 14, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>

      {/* ── SET DATE SHEET ── */}
      {showDateSheet && bookingId && (
        <SetDateSheet
          bookingId={bookingId}
          listingTitle={listing.title}
          onClose={() => { setShowDateSheet(false); router.push("/bookings"); }}
          onSuccess={() => { setShowDateSheet(false); router.push("/bookings"); }}
        />
      )}

      {/* ── FULLSCREEN ZOOM VIEWER ── */}
      {zoomOpen && images.length > 0 && (
        <ZoomViewer images={images} startIndex={activeImage} onClose={() => setZoomOpen(false)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}