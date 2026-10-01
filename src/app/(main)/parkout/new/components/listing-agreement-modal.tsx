// src/app/(main)/parkout/new/components/listing-agreement-modal.tsx
// Bottom sheet modal shown when user taps "Submit Listing".
// Shows listing summary first so user can spot mistakes.
// Then 5 agreement points — user must scroll + tick checkbox.
// Only then does the actual API call fire.

"use client";

import { useState, useRef, useEffect } from "react";

const ROOM_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "room":      "Single Room",
  "1-bed":     "1 Bedroom Flat",
  "2-bed":     "2 Bedroom Flat",
};

type ExtraFee = { name: string; amount: string };

type Props = {
  // Step 1 data for summary
  roomType:      string;
  annualRent:    number;   // naira
  moveOutDate:   string;
  neighbourhood: string;
  lga:           string;
  state:         string;
  cautionFee:    number;
  agreementFee:  number;
  extraFees:     ExtraFee[];
  // Actions
  onConfirm:  () => void;
  onCancel:   () => void;
  submitting: boolean;
};

const AGREEMENT_POINTS = [
  {
    icon: "✅",
    title: "Accuracy of information",
    body:  "All information I have provided — room details, photos, landlord rules, move-in fees and transport estimates — is accurate and up to date. False or misleading information will result in immediate listing removal and account suspension.",
  },
  {
    icon: "🤝",
    title: "Facilitation arrangement",
    body:  "I understand that the property facilitation fee is handled outside CorperNest according to the arrangement between the relevant parties. I will follow the agreed process and provide accurate information about the listing.",
  },
  {
    icon: "📞",
    title: "Availability for inspection",
    body:  "I will make myself or my caretaker/landlord available to the assigned Ambassador for listing verification and will ensure access to the property on the agreed inspection day.",
  },
  {
    icon: "💰",
    title: "Facilitation fee",
    body:  "I understand that the property facilitation fee is 10% of the annual rent. CorperNest does not collect this fee through the Park-Out listing submission.",
  },
  {
    icon: "⚠️",
    title: "Completion and handover",
    body:  "I understand that listing submission does not guarantee a completed deal. I will cooperate with the assigned Ambassador and provide access for verification and inspection as agreed.",
  },
];

function fmt(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function Spinner() {
  return (
    <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
  );
}

export default function ListingAgreementModal({
  roomType, annualRent, moveOutDate, neighbourhood, lga, state,
  cautionFee, agreementFee, extraFees,
  onConfirm, onCancel, submitting,
}: Props) {
  const [agreed,   setAgreed]   = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const facilitationFee = Math.round(annualRent * 0.10);
  const safeExtraFees      = extraFees ?? [];

  function handleScroll() {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
  }

  useEffect(() => {
    const el = contentRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 20) setScrolled(true);
  }, []);

  const moveOutFormatted = moveOutDate
    ? new Date(moveOutDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onCancel}
        style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />

      {/* Bottom sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
        backgroundColor: "var(--color-card)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.2)",
        maxHeight: "88dvh",
        display: "flex", flexDirection: "column",
      }}>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "12px 20px 14px", borderBottom: "1px solid var(--color-border)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 800, color: "var(--color-text)", margin: "0 0 3px" }}>
            Review your listing
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
            Check everything is correct before submitting
          </p>
        </div>

        {/* Scrollable content */}
        <div ref={contentRef} onScroll={handleScroll}
          style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* ── LISTING SUMMARY ── */}
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border)", marginBottom: 16 }}>
            <div style={{ padding: "10px 14px", backgroundColor: "var(--color-primary)" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>📋 Listing summary</p>
            </div>

            {[
              { label: "Room type",     value: ROOM_LABELS[roomType] ?? roomType },
              { label: "Annual rent",   value: `${fmt(annualRent)}/yr`           },
              { label: "Move-out date", value: moveOutFormatted                  },
              { label: "Location",      value: `${neighbourhood}, ${lga}, ${state}` },
            ].map((row, i) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", gap: 12,
                padding: "10px 14px",
                backgroundColor: i % 2 === 0 ? "var(--color-card)" : "var(--color-bg)",
                borderBottom: "1px solid var(--color-border)",
              }}>
                <span style={{ fontSize: 12, color: "var(--color-text-muted)", flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", textAlign: "right" }}>{row.value}</span>
              </div>
            ))}

            {/* Move-in fees */}
            <div style={{ padding: "10px 14px", backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Move-in fees
              </p>
              {[
                { label: "Caution deposit",  amount: cautionFee,   note: "(refundable)" },
                { label: "Agreement fee",    amount: agreementFee, note: "(non-refundable)" },
                ...safeExtraFees
                  .filter((f) => f.name?.trim() && Number(f.amount) > 0)
                  .map((f) => ({ label: f.name, amount: Number(f.amount), note: "" })),
              ].map((fee, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    {fee.label} <span style={{ fontSize: 10 }}>{fee.note}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: Number(fee.amount) === 0 ? "var(--color-text-muted)" : "var(--color-text)" }}>
                    {Number(fee.amount) === 0 ? "None" : fmt(Number(fee.amount))}
                  </span>
                </div>
              ))}
            </div>

            {/* Facilitation fee */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: "var(--color-light)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Property facilitation fee (10%)</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 900, color: "var(--color-primary)", margin: 0 }}>
                {fmt(facilitationFee)}
              </p>
            </div>
          </div>

          {/* Mistake prompt */}
          <div style={{ borderRadius: 12, padding: "10px 14px", backgroundColor: "#FFF8E1", border: "1px solid #FAC775", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.55 }}>
              ✏️ Spotted a mistake? Tap <strong>Go back</strong> to correct it before submitting.
            </p>
          </div>

          {/* ── AGREEMENT POINTS ── */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
            Listing agreement
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {AGREEMENT_POINTS.map((point, i) => (
              <div key={i} style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{point.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
                      {i + 1}. {point.title}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.65 }}>
                      {point.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!scrolled && (
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: "12px 0 0", fontStyle: "italic" }}>
              ↓ Scroll down to read all terms and agree
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px 28px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>

          {/* Checkbox */}
          <div
            onClick={() => { if (scrolled) setAgreed(!agreed); }}
            style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14, cursor: scrolled ? "pointer" : "not-allowed", opacity: scrolled ? 1 : 0.5 }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
              border: `2px solid ${agreed ? "var(--color-primary)" : "var(--color-border)"}`,
              backgroundColor: agreed ? "var(--color-primary)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {agreed && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p style={{ fontSize: 13, color: agreed ? "var(--color-primary)" : "var(--color-text-muted)", margin: 0, lineHeight: 1.6, fontWeight: agreed ? 600 : 400 }}>
              I confirm the listing details above are correct and I agree to the listing terms.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel} disabled={submitting}
              style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
              Go back
            </button>
            <button onClick={onConfirm} disabled={!agreed || submitting}
              style={{
                flex: 2, padding: "13px", borderRadius: 12, border: "none",
                backgroundColor: !agreed || submitting ? "var(--color-border)" : "var(--color-primary)",
                color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14,
                cursor: !agreed || submitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s",
              }}>
              {submitting ? <><Spinner /> Submitting…</> : "Confirm & Submit →"}
            </button>
          </div>

          {!scrolled && (
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: "8px 0 0" }}>
              Scroll through all terms to enable the agreement checkbox
            </p>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}