// src/app/(main)/parkout/new/steps/step-three.tsx
// Step 3 of the Park-Out listing form — Private Details & Bank.
//
// TEMP — Paystack disabled:
// → bankVerified derived from !!data.accountName (not useState)
// → Auto-verify useEffect body is commented out
// → No Paystack calls made at all
//
// RESTORE when Paystack works — search "RESTORE" in this file:
// 1. Change: const bankVerified = !!data.accountName;
//    Back to: const [bankVerified, setBankVerified] = useState(!!data.accountName);
// 2. Uncomment the useEffect body
// 3. Uncomment setBankVerified(false) in onChange handlers
// 4. Uncomment setBankVerified(true) in handleVerifyBank

"use client";

import { useState } from "react";
import { toast } from "sonner";
import CommissionPreview from "../components/commission-preview";
import ListingAgreementModal from "../components/listing-agreement-modal";

export type StepThreeData = {
  exactAddress:    string;
  caretakerName:   string;
  caretakerPhone:  string;
};

type Props = {
  data:          StepThreeData;
  annualRent:    number;
  // Step 1 data passed through for modal summary
  roomType:      string;
  moveOutDate:   string;
  neighbourhood: string;
  lga:           string;
  state:         string;
  cautionFee:    string;
  agreementFee:  string;
  extraFees:     Array<{ name: string; amount: string }>;
  onChange:      (updated: Partial<StepThreeData>) => void;
  onSubmit:      () => void;
  onBack:        () => void;
  submitting:    boolean;
};

function Spinner({ color = "#fff" }: { color?: string }) {
  return (
    <span style={{
      width: 16, height: 16, borderRadius: "50%",
      border: `2px solid ${color}30`,
      borderTopColor: color,
      animation: "spin 0.8s linear infinite",
      display: "inline-block",
    }} />
  );
}

export default function StepThree({ data, annualRent, roomType, moveOutDate, neighbourhood, lga, state, cautionFee, agreementFee, extraFees, onChange, onSubmit, onBack, submitting }: Props) {
  const [showModal,        setShowModal]        = useState(false);

  function handleSubmit() {
    if (!data.exactAddress.trim())   { toast.error("Enter the exact address.");           return; }
    if (!data.caretakerName.trim())  { toast.error("Enter caretaker or landlord name.");  return; }
    if (!data.caretakerPhone.trim()) { toast.error("Enter caretaker or landlord phone."); return; }
    // Validation passed — show agreement modal before submitting
    setShowModal(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14,
    border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)",
    color: "var(--color-text)", outline: "none", boxSizing: "border-box",
    fontFamily: "var(--font-body)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)",
    display: "block", marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Private notice */}
      <div style={{
        borderRadius: 14, padding: "12px 14px",
        backgroundColor: "var(--color-light)",
        border: "1px solid var(--color-border)",
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
          Information on this page is <strong>strictly private</strong>.
          It is only visible to your assigned CorperNest Ambassador and admin.
          It is never shown publicly.
        </p>
      </div>

      {/* ── Exact address ── */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
          Exact address <span style={{ color: "#E53935" }}>*</span>
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
          Full street address including house number, street name and any identifying details
        </p>
        <textarea
          value={data.exactAddress}
          onChange={(e) => onChange({ exactAddress: e.target.value })}
          placeholder="e.g. 12 Eket Road, Apartment 3B, Opposite Mobil Filling Station, Eket"
          rows={3}
          style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
        />
      </div>

      {/* ── Caretaker / Landlord contact ── */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
          Caretaker or Landlord contact <span style={{ color: "#E53935" }}>*</span>
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
          Your Ambassador will call this person to verify the listing before it goes live.
          This prevents fake listings and inspection issues.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Name</label>
          <input
            value={data.caretakerName}
            onChange={(e) => onChange({ caretakerName: e.target.value })}
            placeholder="Caretaker or landlord full name"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Phone number</label>
          <input
            value={data.caretakerPhone}
            onChange={(e) => onChange({ caretakerPhone: e.target.value })}
            placeholder="08012345678"
            type="tel"
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Commission preview ── */}
      <CommissionPreview annualRent={annualRent} />

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={onBack} disabled={submitting}
          style={{
            flex: 1, padding: "14px", borderRadius: 14,
            border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)",
            color: "var(--color-text-secondary)", fontSize: 14, fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}>
          ← Back
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting}
          style={{
            flex: 2, padding: "14px", borderRadius: 14,
            border: "none", backgroundColor: submitting ? "var(--color-border)" : "var(--color-primary)",
            color: "#fff", fontFamily: "var(--font-heading)",
            fontWeight: 700, fontSize: 14,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {submitting ? <><Spinner /> Submitting…</> : "Submit Listing →"}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Agreement modal — shown when user taps submit */}
      {showModal && (
        <ListingAgreementModal
          roomType={roomType}
          annualRent={annualRent}
          moveOutDate={moveOutDate}
          neighbourhood={neighbourhood}
          lga={lga}
          state={state}
          cautionFee={Number(cautionFee) || 0}
          agreementFee={Number(agreementFee) || 0}
          extraFees={extraFees ?? []}
          onConfirm={() => { setShowModal(false); onSubmit(); }}
          onCancel={() => setShowModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}