"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AMENITY_MAP: Record<string, { icon: string; label: string }> = {
  "running-water":    { icon: "💧", label: "Water"     },
  "prepaid-meter":    { icon: "⚡", label: "Prepaid"   },
  "band-a-light":     { icon: "🔆", label: "Band A"    },
  "band-b-light":     { icon: "💡", label: "Band B"    },
  "tiled-floors":     { icon: "🪟", label: "Tiled"     },
  "ceiling-fan":      { icon: "🌀", label: "Fan"        },
  "furnished":        { icon: "🛋️", label: "Furnished" },
  "kitchen":          { icon: "🍳", label: "Kitchen"   },
  "bathroom-inside":  { icon: "🚿", label: "Bathroom"  },
  "security-gate":    { icon: "🔒", label: "Security"  },
  "parking-space":    { icon: "🚗", label: "Parking"   },
  "fence-compound":   { icon: "🏠", label: "Fenced"    },
  "good-road-access": { icon: "🛣️", label: "Good road" },
  "close-to-nysc":    { icon: "📍", label: "Near NYSC" },
  "good-network":     { icon: "📶", label: "Network"   },
};

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom",
  "2-bed":     "2 Bedroom",
  "3-bed":     "3 Bedroom",
  "room":      "Single Room",
};

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  available:          { bg: "#EAF3DE", color: "#27500A", dot: "#43A047" },
  reserved:           { bg: "#FAEEDA", color: "#633806", dot: "#F59E0B" },
  occupied:           { bg: "#FCEBEB", color: "#791F1F", dot: "#E53935" },
  "temp-unavailable": { bg: "#F3F4F6", color: "#4B5563", dot: "#9CA3AF" },
  "under-review":     { bg: "#EEF2FF", color: "#3730A3", dot: "#6366F1" },
};

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Listed today";
  if (days === 1) return "Listed yesterday";
  if (days < 30)  return `Listed ${days}d ago`;
  return "Listed 30+ days ago";
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type PropertyCardData = {
  id:              string;
  title:           string;
  description:     string;
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
  landmark?:       string | null;         // ← NEW
  agencyFeePercent?: number | null;       // ← NEW
};

type PropertyCardProps = {
  listing:            PropertyCardData;
  isWatchlisted?:     boolean;
  onWatchlistChange?: (listingId: string, watching: boolean) => void;
  isLoggedIn?:        boolean;
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function PropertyCard({
  listing,
  isWatchlisted = false,
  onWatchlistChange,
  isLoggedIn = false,
}: PropertyCardProps) {
  const router = useRouter();
  const [watching, setWatching] = useState(isWatchlisted);
  const [toggling, setToggling] = useState(false);

  const coverImage  = listing.images?.[0] ?? null;
  const badge       = statusStyle[listing.status] ?? statusStyle.available;
  const typeLabel   = TYPE_LABELS[listing.type] ?? listing.type;
  const isForSale   = listing.listingPurpose === "sale";
  const isAvailable = listing.status === "available";
  const topAmenities = (listing.amenities ?? []).slice(0, 3);

  // Agency fee calc
  const agencyFeeNaira = listing.agencyFeePercent && listing.price
    ? Math.round(listing.price * (listing.agencyFeePercent / 100))
    : null;

  function handleViewProperty() {
    router.push(`/properties/${listing.id}`);
  }

  function handleBookInspection(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/signin?callbackUrl=/properties/${listing.id}`);
      return;
    }
    router.push(`/properties/${listing.id}?action=book`);
  }

  async function handleWatchlistToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) { router.push(`/signin?callbackUrl=/properties/${listing.id}`); return; }
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
      if (!res.ok) {
        setWatching(!newWatching);
        if (res.status === 401) router.push(`/signin?callbackUrl=/properties/${listing.id}`);
        return;
      }
      if (newWatching) {
        toast.success("Added to watchlist", { description: listing.title, duration: 2500 });
      } else {
        toast("Removed from watchlist", { duration: 2000 });
      }
      onWatchlistChange?.(listing.id, newWatching);
    } catch {
      setWatching(!newWatching);
      toast.error("Could not update watchlist. Try again.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, overflow: "hidden" }}>

      {/* ── COVER IMAGE ── */}
      <div style={{ position: "relative", width: "100%", height: 210, cursor: "pointer" }} onClick={handleViewProperty}>
        {coverImage ? (
          <img src={coverImage} alt={listing.title} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#E8F5E9" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#7A9A7A" strokeWidth="1.4" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#7A9A7A" strokeWidth="1.4" />
              <path d="M21 15l-5-5L5 21" stroke="#7A9A7A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />

        {/* Status badge — top left */}
        <span style={{ position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, backgroundColor: badge.bg, color: badge.color, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: badge.dot, flexShrink: 0 }} />
          {listing.status.replace(/-/g, " ")}
        </span>

        {/* Purpose badge */}
        <span style={{ position: "absolute", top: 10, right: 44, fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, backgroundColor: isForSale ? "#FEF3C7" : "#E8F5E9", color: isForSale ? "#92400E" : "#1B5E20", pointerEvents: "none" }}>
          {isForSale ? "For Sale" : "For Rent"}
        </span>

        {/* Watchlist */}
        <button onClick={handleWatchlistToggle} disabled={toggling}
          style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          aria-label={watching ? "Remove from watchlist" : "Save property"}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke={watching ? "#E53935" : "white"} strokeWidth="1.8" fill={watching ? "#E53935" : "none"} />
          </svg>
        </button>

        {/* Bottom overlay — price + date */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 12px 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", pointerEvents: "none" }}>
          <p style={{ color: "#fff", fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 800, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.6)", lineHeight: 1 }}>
            ₦{listing.price.toLocaleString()}
            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginLeft: 2 }}>
              {isForSale ? " one-time" : "/yr"}
            </span>
          </p>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}>
            {timeAgo(listing.createdAt)}
          </span>
        </div>
      </div>

      {/* ── CARD BODY ── */}
      <div style={{ padding: "12px 14px 14px" }}>

        {/* Title + type badge */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <p style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, margin: 0, flex: 1, minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
            {listing.title}
          </p>
          {/* Fixed: full label, white-space nowrap prevents truncation */}
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8, backgroundColor: "var(--color-light)", color: "var(--color-primary)", border: "1px solid var(--color-border)", flexShrink: 0, whiteSpace: "nowrap" }}>
            {typeLabel}
          </span>
        </div>

        {/* Location — LGA + State */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: listing.landmark ? 4 : 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="var(--color-text-muted)" strokeWidth="1.8" />
            <circle cx="12" cy="10" r="3" stroke="var(--color-text-muted)" strokeWidth="1.8" />
          </svg>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
            {listing.lga}, {listing.state}
          </p>
        </div>

        {/* Landmark — shown when available */}
        {listing.landmark && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M12 3l9 9-9 9" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 12, color: "var(--color-primary)", margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {listing.landmark}
            </p>
          </div>
        )}

        {/* Agency fee — shown when set */}
        {agencyFeeNaira !== null && (
          <div style={{ marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "#FFF8E1", border: "1px solid #FAC775" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 11, color: "#B45309", margin: 0, fontWeight: 700 }}>
              Agency fee: {listing.agencyFeePercent}% — ₦{agencyFeeNaira.toLocaleString()}
            </p>
          </div>
        )}

        {/* Amenities */}
        {topAmenities.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {topAmenities.map((slug) => {
              const amenity = AMENITY_MAP[slug];
              if (!amenity) return null;
              return (
                <span key={slug} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 8px", borderRadius: 8, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                  <span style={{ fontSize: 10 }}>{amenity.icon}</span>
                  {amenity.label}
                </span>
              );
            })}
            {(listing.amenities ?? []).length > 3 && (
              <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 8, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                +{(listing.amenities ?? []).length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isAvailable ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 8 }}>
            <button onClick={handleViewProperty}
              style={{ padding: "11px", borderRadius: 12, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-heading)" }}>
              View
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
            <button onClick={handleBookInspection}
              style={{ padding: "11px", borderRadius: 12, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "var(--color-primary)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-heading)" }}>
              Book Inspection
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : (
          <button onClick={handleViewProperty}
            style={{ width: "100%", padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "var(--color-bg)", border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-heading)" }}>
            View Property
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}