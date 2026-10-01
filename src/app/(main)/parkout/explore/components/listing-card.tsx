// src/app/(main)/parkout/explore/components/listing-card.tsx
// Single Park-Out listing card for the explore feed.
// Shows ONLY public info — exact address is never included.
// Tapping the card goes to /parkout/listing/[id] for full details.

"use client";

import { useRouter } from "next/navigation";
import Countdown from "./countdown";

export type PublicListing = {
  id:             string;
  title:          string;
  roomType:       string;
  state:          string;
  lga:            string;
  neighbourhood:  string;
  annualRent:     number;   // kobo
  facilitationFee: number;  // kobo
  moveOutDate:    string;
  images:         string[];
  landlordRules:  string | null;
  description:    string | null;
  hasLandlordAgent: boolean;
  hasFurnitureForSale: boolean;
};

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

const ROOM_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "room":      "Single Room",
  "1-bed":     "1 Bedroom",
  "2-bed":     "2 Bedroom",
};

type Props = { listing: PublicListing };

export default function ListingCard({ listing }: Props) {
  const router = useRouter();
  const photo  = listing.images[0] ?? null;
  const commission = Math.round(listing.facilitationFee * 0.6); // outgoing earns 60%

  return (
    <div
      onClick={() => router.push(`/parkout/listing/${listing.id}`)}
      style={{
        borderRadius: 16, overflow: "hidden",
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        cursor: "pointer",
      }}
    >
      {/* Photo */}
      <div style={{ position: "relative", height: 190, backgroundColor: "var(--color-light)" }}>
        {photo ? (
          <img src={photo} alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40 }}>🏠</span>
          </div>
        )}

        {/* Countdown badge — top left */}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <Countdown moveOutDate={listing.moveOutDate} />
        </div>

        {/* Room type badge — top right */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 8px",
            borderRadius: 20, backgroundColor: "rgba(0,0,0,0.55)",
            color: "#fff",
          }}>
            {ROOM_LABELS[listing.roomType] ?? listing.roomType}
          </span>
        </div>

        {/* Furniture badge */}
        {listing.hasFurnitureForSale && (
          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 8px",
              borderRadius: 20, backgroundColor: "rgba(0,0,0,0.55)",
              color: "#fff",
            }}>
              🛋 Items available
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "12px 14px" }}>

        {/* Location */}
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 4px" }}>
          📍 {listing.neighbourhood}, {listing.lga}
        </p>

        {/* Title */}
        <p style={{
          fontSize: 14, fontWeight: 700,
          color: "var(--color-text)",
          margin: "0 0 8px",
          fontFamily: "var(--font-heading)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {listing.title}
        </p>

        {/* Rent row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--color-primary)", margin: 0, fontFamily: "var(--font-heading)" }}>
              {formatNaira(listing.annualRent)}<span style={{ fontSize: 11, fontWeight: 500 }}>/yr</span>
            </p>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>
              Facilitation fee: {formatNaira(listing.facilitationFee)}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#15803D", margin: 0 }}>
              Outgoing earns
            </p>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#15803D", margin: 0 }}>
              {formatNaira(commission)}
            </p>
          </div>
        </div>

        {/* Landlord rules */}
        {listing.landlordRules && (
          <p style={{
            fontSize: 11, color: "var(--color-text-muted)",
            margin: "0 0 10px", lineHeight: 1.5,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
          }}>
            📋 {listing.landlordRules}
          </p>
        )}

        {/* Book button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/parkout/listing/${listing.id}`);
          }}
          style={{
            width: "100%", padding: "11px",
            borderRadius: 10, border: "none",
            backgroundColor: "var(--color-primary)",
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "var(--font-heading)",
          }}
        >
          View & Book Inspection — ₦3,000
        </button>
      </div>
    </div>
  );
}