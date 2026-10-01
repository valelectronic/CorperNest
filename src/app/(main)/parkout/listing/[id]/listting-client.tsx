// src/app/(main)/parkout/listing/[id]/listing-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  generateWaLink,
  inspectionBookedMessage,
  PARKOUT_WHATSAPP_NUMBER,
} from "@/lib/whatsapp-link";
import CommissionPreview from "../../new/components/commission-preview";
import TransportEstimates from "./transport-estimate";
import MoveInBreakdown from "./move-in-breakdown";

type Listing = {
  id:                  string;
  outgoingUserId:      string;
  title:               string;
  roomType:            string;
  state:               string;
  lga:                 string;
  neighbourhood:       string;
  annualRent:          number;
  facilitationFee:     number;
  moveOutDate:         Date | string;
  images:              string[];
  description:         string | null;
  landlordRules:       string | null;
  hasLandlordAgent:    boolean;
  hasFurnitureForSale: boolean;
  status:              string;
  moveInFees: { cautionFee: number; agreementFee: number; extraFees: Array<{ name: string; amount: number }> } | null;
  transportEstimates:  Array<{ name: string; bikeCost: number; kekeCost: number }> | null;
};

type Props = { listing: Listing; isOwner: boolean };

const ROOM_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "room":      "Single Room",
  "1-bed":     "1 Bedroom Flat",
  "2-bed":     "2 Bedroom Flat",
};

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

// ── Visual countdown ───────────────────────────────────────────────────────────
function VisualCountdown({ moveOutDate }: { moveOutDate: Date | string }) {
  function getTime() {
    const diff = new Date(moveOutDate).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
    };
  }
  const [time, setTime] = useState(getTime);
  useState(() => {
    const t = setInterval(() => setTime(getTime()), 60_000);
    return () => clearInterval(t);
  });
  if (!time) return (
    <div style={{ textAlign: "center", padding: "12px 0" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#C62828", margin: 0 }}>This room has been vacated</p>
    </div>
  );
  const color = time.days < 3 ? "#C62828" : time.days < 7 ? "#F59E0B" : "var(--color-primary)";
  const bg    = time.days < 3 ? "#FFEBEE" : time.days < 7 ? "#FFF8E1" : "var(--color-light)";
  return (
    <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: bg, border: `1px solid ${color}30`, textAlign: "center" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        ⏱ Moving out in
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {[{ value: time.days, label: "Days" }, { value: time.hours, label: "Hours" }, { value: time.minutes, label: "Mins" }].map((u) => (
          <div key={u.label} style={{ minWidth: 58, padding: "10px 8px", borderRadius: 10, backgroundColor: "var(--color-card)", border: `1px solid ${color}30` }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 900, color, margin: "0 0 2px", lineHeight: 1 }}>
              {String(u.value).padStart(2, "0")}
            </p>
            <p style={{ fontSize: 9, fontWeight: 600, color, margin: 0, opacity: 0.7 }}>{u.label}</p>
          </div>
        ))}
      </div>
      {time.days < 7 && (
        <p style={{ fontSize: 11, fontWeight: 700, color, margin: "8px 0 0" }}>
          {time.days < 3 ? "🔥 Very urgent — act fast!" : "⚡ Moving soon — book quickly"}
        </p>
      )}
    </div>
  );
}

// ── Delete confirm — defined BEFORE ListingClient so TS sees it ───────────────
function DeleteConfirm({ listingId, onCancel }: { listingId: string; onCancel: () => void }) {
  const router     = useRouter();
  const [deleting, setDeleting] = useState(false);
  

  async function handleDelete() {
    setDeleting(true);
    try {
      const res  = await fetch("/api/parkout/listings/delete", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Delete failed. Try again."); return; }
      toast.success("Listing deleted successfully.");
      router.push("/parkout");
    } catch { toast.error("Network error. Try again."); }
    finally { setDeleting(false); }
  }

  return (
    <div style={{ borderRadius: 14, padding: "16px", backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2", marginTop: 8 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#C62828", margin: "0 0 6px" }}>⚠️ Delete this listing?</p>
      <p style={{ fontSize: 12, color: "#C62828", margin: "0 0 14px", lineHeight: 1.6 }}>
        This permanently removes your listing, all photos and proof of occupancy. This cannot be undone.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} disabled={deleting}
          style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={handleDelete} disabled={deleting}
          style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", backgroundColor: "#C62828", color: "#fff", fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer" }}>
          {deleting ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ListingClient({ listing, isOwner }: Props) {
  const router       = useRouter();
  const [photoIdx,   setPhotoIdx]   = useState(0);
  const [copied,     setCopied]     = useState(false);
  const [showDelete, setShowDelete] = useState(false);
const [bookingInspection, setBookingInspection] = useState(false);
  const annualRentNaira = listing.annualRent / 100;

  async function handleShare() {
    const url  = `${window.location.origin}/parkout/listing/${listing.id}`;
    const text = `Check out this ${ROOM_LABELS[listing.roomType] ?? listing.roomType} near ${listing.neighbourhood}, ${listing.lga} — ${formatNaira(listing.annualRent)}/yr on CorperNest`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: listing.title, text, url }); return; } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
      toast.success("Link copied to clipboard ✓");
    } catch { window.prompt("Copy this link:", url); }
  }

  // ── Park-Out WhatsApp support ───────────────────────────────────────────────
  function getInspectionWhatsAppUrl() {
    const message = inspectionBookedMessage({
      tenantName: "A CorperNest user",
      listingTitle: listing.title,
      lga: listing.lga,
      listingId: listing.id,
    });

    return generateWaLink(PARKOUT_WHATSAPP_NUMBER, message);
  }

  async function handleBookInspection() {
  if (bookingInspection) return;

  setBookingInspection(true);

  try {
    const res = await fetch("/api/parkout/inspections/init-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId: listing.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Could not start inspection booking.");
      return;
    }

    if (!data.authorizationUrl) {
      toast.error("Could not start payment. Please try again.");
      return;
    }

    window.location.href = data.authorizationUrl;
  } catch (error) {
    console.error("[parkout/listing] Inspection payment error:", error);
    toast.error("Network error. Please try again.");
  } finally {
    setBookingInspection(false);
  }
}

  return (
    <div style={{ backgroundColor: "var(--color-bg)", paddingBottom: 100 }}>

      {/* ── PHOTO GALLERY ── */}
      <div style={{ position: "relative", height: 280, backgroundColor: "var(--color-light)" }}>
        {listing.images.length > 0 ? (
          <img src={listing.images[photoIdx]} alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 64 }}>🏠</span>
          </div>
        )}
        {/* Back */}
        <button onClick={() => router.back()}
          style={{ position: "absolute", top: 14, left: 14, width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* Dots */}
        {listing.images.length > 1 && (
          <div style={{ position: "absolute", bottom: 48, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
            {listing.images.map((_, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                style={{ width: i === photoIdx ? 20 : 6, height: 6, borderRadius: 3, border: "none", cursor: "pointer", padding: 0, backgroundColor: i === photoIdx ? "#fff" : "rgba(255,255,255,0.5)", transition: "width 0.2s" }} />
            ))}
          </div>
        )}
        {/* Thumbnails */}
        {listing.images.length > 1 && (
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", gap: 4, padding: "0 14px", overflowX: "auto" }}>
            {listing.images.map((url, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                style={{ width: 44, height: 32, borderRadius: 6, flexShrink: 0, overflow: "hidden", padding: 0, cursor: "pointer", border: `2px solid ${i === photoIdx ? "#fff" : "transparent"}` }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* Badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: "var(--color-light)", color: "var(--color-primary)" }}>
            {ROOM_LABELS[listing.roomType] ?? listing.roomType}
          </span>
          {listing.hasFurnitureForSale && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: "#FFF8E1", color: "#F59E0B" }}>
              🛋 Items available
            </span>
          )}
          {isOwner && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: "#E8F5E9", color: "#15803D" }}>
              ✓ Your listing
            </span>
          )}
        </div>

        {/* Title + share */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: 0, flex: 1 }}>
            {listing.title}
          </h1>
          <button onClick={handleShare}
            style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                  stroke="var(--color-text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
          📍 {listing.neighbourhood}, {listing.lga}, {listing.state}
        </p>

        {/* Countdown */}
        <div style={{ marginBottom: 12 }}>
          <VisualCountdown moveOutDate={listing.moveOutDate} />
        </div>

        {/* Rent */}
        <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Annual rent</p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-primary)", margin: 0 }}>
              {formatNaira(listing.annualRent)}<span style={{ fontSize: 12, fontWeight: 500 }}>/yr</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Facilitation fee</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
              {formatNaira(listing.facilitationFee)}
            </p>
          </div>
        </div>

        <MoveInBreakdown
          annualRent={listing.annualRent}
          facilitationFee={listing.facilitationFee}
          moveInFees={listing.moveInFees}
        />

        {/* Transport estimates */}
        {listing.transportEstimates && listing.transportEstimates.length > 0 && (
          <TransportEstimates estimates={listing.transportEstimates} />
        )}

        {/* Description */}
        {listing.description && (
          <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 6px" }}>About this room</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.65 }}>{listing.description}</p>
          </div>
        )}

        {/* Items available */}
        {listing.hasFurnitureForSale && (
          <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 6px" }}>🛋 Items available in room</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.65 }}>
              This listing includes items for sale or handover. Ask the Ambassador for full details after booking.
            </p>
          </div>
        )}

        {/* Landlord rules */}
        {listing.landlordRules && (
          <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 6px" }}>📋 Landlord rules</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.65 }}>{listing.landlordRules}</p>
          </div>
        )}

        {/* Agent notice */}
        {listing.hasLandlordAgent && (
          <div style={{ borderRadius: 14, padding: "12px 14px", backgroundColor: "#FFF8E1", border: "1px solid #FAC775", marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.55 }}>
              ℹ️ This property has a landlord-assigned agent. You may need to interact with them during the agreement process.
            </p>
          </div>
        )}

        {/* Facilitation fee — owner only */}
        {isOwner && <CommissionPreview annualRent={annualRentNaira} />}

        {/* Owner: status card + delete */}
        {isOwner && (
          <div style={{ marginTop: 12 }}>
            <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#15803D", margin: "0 0 4px" }}>✓ Your listing is live</p>
              <p style={{ fontSize: 12, color: "#2E7D32", margin: 0, lineHeight: 1.6 }}>
                The property facilitation arrangement is handled outside CorperNest.
              </p>
            </div>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)}
                style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1.5px solid #FFCDD2", backgroundColor: "transparent", color: "#C62828", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                🗑 Delete this listing
              </button>
            ) : (
              <DeleteConfirm listingId={listing.id} onCancel={() => setShowDelete(false)} />
            )}
          </div>
        )}

        {/* Incoming tenant: address privacy notice */}
        {!isOwner && (
          <div style={{ borderRadius: 14, padding: "12px 14px", backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.55 }}>
              Inspection details will be provided through the CorperNest booking process. An Ambassador escorts confirmed inspections.
            </p>
          </div>
        )}
      </div>

      {/* ── STICKY BOOK BUTTON — incoming tenant only ── */}
      {!isOwner && listing.status === "active" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 16px 20px",
            backgroundColor: "var(--color-card)",
            borderTop: "1px solid var(--color-border)",
            zIndex: 40,
          }}
        >
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <button
              onClick={handleBookInspection}
              disabled={bookingInspection}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 14,
                border: "none",
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 15,
                cursor: bookingInspection ? "not-allowed" : "pointer",
                opacity: bookingInspection ? 0.7 : 1,
              }}
            >
              {bookingInspection ? "Opening payment…" : "Book Inspection — ₦3,000"}
            </button>
            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                textAlign: "center",
                margin: "6px 0 0",
              }}
            >
              Secure slot · Ambassador escorts you · Refundable according to the inspection outcome
            </p>
          </div>
        </div>
      )}

      {/* ── STICKY BOOKING CONFIRMATION — incoming tenant only ── */}
      {!isOwner && listing.status === "booking_locked" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 16px 20px",
            backgroundColor: "var(--color-card)",
            borderTop: "1px solid var(--color-border)",
            zIndex: 40,
          }}
        >
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div
              style={{
                borderRadius: 14,
                padding: "12px 14px",
                backgroundColor: "#E8F5E9",
                border: "1px solid #A5D6A7",
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#15803D",
                  margin: "0 0 4px",
                }}
              >
                ✓ Inspection booked
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "#2E7D32",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                Your inspection slot is locked. Message CorperNest to get the next inspection details.
              </p>
            </div>

            <a
              href={getInspectionWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                padding: "15px",
                borderRadius: 14,
                backgroundColor: "#15803D",
                color: "#fff",
                textAlign: "center",
                textDecoration: "none",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Message CorperNest on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
