// src/app/(main)/parkout/inspection-terms/[listingId]/inspection-client.tsx
// Inspection terms page — shown before tenant pays ₦3,000 inspection fee.
// Shows listing summary + what the fee covers + terms + pay button.
// Paystack payment is initialised through the Park-Out booking API.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

type Listing = {
  id:              string;
  title:           string;
  roomType:        string;
  lga:             string;
  state:           string;
  neighbourhood:   string;
  annualRent:      number;
  facilitationFee: number;
  moveOutDate:     Date | string | null;
  images:          string[] | null;
  ambassadorId:    string | null;
};

type Props = {
  listing:  Listing;
  userName: string;
};

const ROOM_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "room":      "Single Room",
  "1-bed":     "1 Bedroom Flat",
  "2-bed":     "2 Bedroom Flat",
};

function fmt(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

const INSPECTION_FEE = 3000; // naira

const TERMS = [
  {
    icon: "🏠",
    title: "Physical inspection arranged",
    body: "A CorperNest Location Ambassador will contact you within 24 hours to arrange a convenient date and time to visit the property.",
  },
  {
    icon: "🔒",
    title: "Exact address revealed after payment",
    body: "The precise address of the property is only shared after your inspection fee is confirmed. The Ambassador will escort you to the location.",
  },
  {
    icon: "💰",
    title: "What the ₦3,000 covers",
    body: "The ₦3,000 inspection fee is paid to CorperNest. It covers the inspection arrangement and coordination with the Location Ambassador.",
  },
  {
    icon: "✅",
    title: "If the room matches the listing",
    body: "You proceed to pay the facilitation fee to secure the room. The facilitation fee is 10% of the annual rent.",
  },
  {
    icon: "⚠️",
    title: "If the room does not match",
    body: "Report the outcome to CorperNest after the inspection. Your refund will depend on the inspection outcome recorded by the Ambassador.",
  },
  {
    icon: "🤝",
    title: "No direct dealing",
    body: "All negotiations and payments must go through CorperNest. Do not pay the outgoing tenant directly outside the platform.",
  },
];

export default function InspectionClient({ listing, userName }: Props) {
  const router = useRouter();
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);

  const photo       = listing.images?.[0];
  const firstName   = userName.split(" ")[0];
  const moveOutDate = listing.moveOutDate
    ? new Date(listing.moveOutDate).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  async function handlePay() {
    if (!agreed) {
      toast.error("Please agree to the inspection terms first.");
      return;
    }

    if (!listing.ambassadorId) {
      toast.error("No ambassador assigned to this listing yet. Please check back soon.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/parkout/booking/${listing.id}/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Payment could not be started. Try again.");
        return;
      }

      if (!data.authorizationUrl) {
        toast.error("Payment could not be started. Please try again.");
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100dvh", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ padding: "14px 16px", backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", padding: 4 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Park-Out & Earn
          </p>

          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
            Book Inspection
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* Listing summary card */}
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border)", marginBottom: 16 }}>
          {photo && (
            <div style={{ height: 140, overflow: "hidden" }}>
              <img
                src={photo}
                alt={listing.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          <div style={{ padding: "12px 14px", backgroundColor: "var(--color-card)" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px" }}>
              {listing.title}
            </p>

            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 10px" }}>
              {listing.neighbourhood}, {listing.lga} · {ROOM_LABELS[listing.roomType] ?? listing.roomType}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", textAlign: "center" }}>
                <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px" }}>
                  Annual rent
                </p>

                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                  {fmt(listing.annualRent)}
                </p>
              </div>

              <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", textAlign: "center" }}>
                <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px" }}>
                  Move-out date
                </p>

                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                  {moveOutDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inspection fee highlight */}
        <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-primary)", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Inspection fee
            </p>

            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 900, color: "#fff", margin: 0 }}>
              ₦{INSPECTION_FEE.toLocaleString("en-NG")}
            </p>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "2px 0 0" }}>
              One-time · Refund depends on inspection outcome
            </p>
          </div>

          <span style={{ fontSize: 40 }}>🏠</span>
        </div>

        {/* No ambassador warning */}
        {!listing.ambassadorId && (
          <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "#FFF8E1", border: "1px solid #FAC775", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.6 }}>
              ⚠️ No ambassador has been assigned to this listing yet. Admin will assign one shortly. Please check back in a few hours.
            </p>
          </div>
        )}

        {/* Terms */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
          What happens when you pay
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {TERMS.map((term, i) => (
            <div
              key={i}
              style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", display: "flex", gap: 10 }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>
                {term.icon}
              </span>

              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 3px" }}>
                  {term.title}
                </p>

                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
                  {term.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Agreement checkbox */}
        <div
          onClick={() => setAgreed(!agreed)}
          style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16, cursor: "pointer", padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: `1.5px solid ${agreed ? "var(--color-primary)" : "var(--color-border)"}` }}
        >
          <div
            style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `2px solid ${agreed ? "var(--color-primary)" : "var(--color-border)"}`, backgroundColor: agreed ? "var(--color-primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
          >
            {agreed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <p style={{ fontSize: 13, color: agreed ? "var(--color-primary)" : "var(--color-text-muted)", margin: 0, lineHeight: 1.6, fontWeight: agreed ? 600 : 400 }}>
            I have read and understood the inspection terms above. I agree to pay ₦{INSPECTION_FEE.toLocaleString("en-NG")} for an inspection of this property.
          </p>
        </div>
      </div>

      {/* Sticky pay button */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px 24px", backgroundColor: "var(--color-card)", borderTop: "1px solid var(--color-border)", zIndex: 40 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <button
            onClick={handlePay}
            disabled={!agreed || loading || !listing.ambassadorId}
            style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: !agreed || loading || !listing.ambassadorId ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: !agreed || loading || !listing.ambassadorId ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Processing…
              </>
            ) : (
              `Pay ₦${INSPECTION_FEE.toLocaleString("en-NG")} to Book Inspection`
            )}
          </button>

          <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: "6px 0 0" }}>
            Secure payment via Paystack · Ambassador escorts all inspections
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}