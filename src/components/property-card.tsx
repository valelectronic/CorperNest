"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const AMENITY_MAP: Record<string, { icon: string; label: string }> = {
  "running-water":    { icon: "💧", label: "Water" },
  "prepaid-meter":    { icon: "⚡", label: "Prepaid" },
  "band-a-light":     { icon: "🔆", label: "Band A" },
  "band-b-light":     { icon: "💡", label: "Band B" },
  "tiled-floors":     { icon: "🪟", label: "Tiled" },
  "ceiling-fan":      { icon: "🌀", label: "Fan" },
  "furnished":        { icon: "🛋️", label: "Furnished" },
  "kitchen":          { icon: "🍳", label: "Kitchen" },
  "bathroom-inside":  { icon: "🚿", label: "Bathroom" },
  "security-gate":    { icon: "🔒", label: "Security" },
  "parking-space":    { icon: "🚗", label: "Parking" },
  "fence-compound":   { icon: "🏠", label: "Fenced" },
  "good-road-access": { icon: "🛣️", label: "Good road" },
  "close-to-nysc":    { icon: "📍", label: "Near NYSC" },
  "good-network":     { icon: "📶", label: "Network" },
};

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Con",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom",
  "2-bed":     "2 Bedroom",
  "room":      "Single Room",
};

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  available:            { bg: "#EAF3DE", color: "#27500A", dot: "#43A047" },
  reserved:             { bg: "#FAEEDA", color: "#633806", dot: "#F59E0B" },
  occupied:             { bg: "#FCEBEB", color: "#791F1F", dot: "#E53935" },
  "temp-unavailable":   { bg: "#F3F4F6", color: "#4B5563", dot: "#9CA3AF" },
  "under-review":       { bg: "#EEF2FF", color: "#3730A3", dot: "#6366F1" },
};

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Listed today";
  if (days === 1) return "Listed yesterday";
  if (days < 30)  return `Listed ${days}d ago`;
  return "Listed 30+ days ago";
}

export type PropertyCardData = {
  id: string;
  title: string;
  description: string;
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

type PropertyCardProps = {
  listing: PropertyCardData;
  isWatchlisted?: boolean;
  onWatchlistChange?: (listingId: string, watching: boolean) => void;
  isLoggedIn?: boolean;
};

export default function PropertyCard({
  listing,
  isWatchlisted = false,
  onWatchlistChange,
  isLoggedIn = false,
}: PropertyCardProps) {
  const router = useRouter();
  const [watching, setWatching] = useState(isWatchlisted);
  const [toggling, setToggling] = useState(false);


  const coverImage = listing.images?.[0] ?? null;
  const badge = statusStyle[listing.status] ?? statusStyle.available;
  const typeLabel = TYPE_LABELS[listing.type] ?? listing.type;
  const isForSale = listing.listingPurpose === "sale";
  const isAvailable = listing.status === "available";
  const topAmenities = (listing.amenities ?? []).slice(0, 3);

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });

      if (!res.ok) {
        setWatching(!newWatching);
        if (res.status === 401) {
          router.push(`/signin?callbackUrl=/properties/${listing.id}`);
        }
        return;
      }

      if (newWatching) {
        toast.success("Added to watchlist", {
          description: listing.title,
          duration: 2500,
        });
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* ── COVER IMAGE ── */}
      <div
        className="relative w-full cursor-pointer"
        style={{ height: "210px" }}
        onClick={handleViewProperty}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: "#E8F5E9" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2"
                stroke="#7A9A7A" strokeWidth="1.4" />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#7A9A7A" strokeWidth="1.4" />
              <path d="M21 15l-5-5L5 21" stroke="#7A9A7A" strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)",
          pointerEvents: "none",
        }} />

        {/* Status badge — top left */}
        <span
          className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: badge.dot }} />
          {listing.status.replace(/-/g, " ")}
        </span>

        {/* Watchlist heart — top right */}
        <button
          onClick={handleWatchlistToggle}
          disabled={toggling}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          aria-label={watching ? "Remove from watchlist" : "Save property"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke={watching ? "#E53935" : "white"}
              strokeWidth="1.8"
              fill={watching ? "#E53935" : "none"}
            />
          </svg>
        </button>

        {/* Bottom overlay row — price left, listed date right */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end justify-between"
          style={{ pointerEvents: "none" }}>

          {/* Price */}
          <p className="text-base font-bold leading-none"
            style={{
              color: "#fff",
              fontFamily: "var(--font-heading)",
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}>
            ₦{listing.price.toLocaleString()}
            <span className="text-xs font-normal opacity-80 ml-0.5">
              {isForSale ? " one-time" : "/yr"}
            </span>
          </p>

          {/* Listed date — right side, obvious white pill */}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{
              backgroundColor: "rgba(0,0,0,0.55)",
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            {timeAgo(listing.createdAt)}
          </span>
        </div>

        {/* Purpose badge — floats above bottom row on far right top area */}
        <span
          className="absolute top-3 right-12 text-xs font-semibold px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: isForSale ? "#FEF3C7" : "#E8F5E9",
            color: isForSale ? "#92400E" : "#1B5E20",
            pointerEvents: "none",
          }}
        >
          {isForSale ? "For Sale" : "For Rent"}
        </span>
      </div>

      {/* ── LISTING INFO ── */}
      <div className="px-4 pt-3 pb-4">

        {/* Title + type badge */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p
            className="text-sm font-semibold leading-snug flex-1 min-w-0"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {listing.title}
          </p>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-lg shrink-0"
            style={{
              backgroundColor: "var(--color-light)",
              color: "var(--color-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
              stroke="var(--color-text-muted)" strokeWidth="1.8" />
            <circle cx="12" cy="10" r="3"
              stroke="var(--color-text-muted)" strokeWidth="1.8" />
          </svg>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {listing.lga}, {listing.state}
          </p>
        </div>

        {/* Amenities preview */}
        {topAmenities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {topAmenities.map((slug) => {
              const amenity = AMENITY_MAP[slug];
              if (!amenity) return null;
              return (
                <span key={slug}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}>
                  <span style={{ fontSize: "11px" }}>{amenity.icon}</span>
                  {amenity.label}
                </span>
              );
            })}
            {(listing.amenities ?? []).length > 3 && (
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}>
                +{(listing.amenities ?? []).length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isAvailable ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleViewProperty}
              className="py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:opacity-80"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1.5px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              View
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                  stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
            <button
              onClick={handleBookInspection}
              className="py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:opacity-80"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                fontFamily: "var(--font-heading)",
              }}
            >
              Book Inspection
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={handleViewProperty}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:opacity-80"
            style={{
              backgroundColor: "var(--color-bg)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            View Property
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}