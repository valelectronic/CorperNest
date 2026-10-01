// src/app/(main)/parkout/new/steps/step-one.tsx
// Step 1 — Room Details + Move-in Fees.
// Uses ?? [] on all extraFees references to handle
// old localStorage drafts that don't have the field yet.

"use client";

import { toast } from "sonner";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";

export type ExtraFee = { name: string; amount: string };

export type StepOneData = {
  roomType:         string;
  annualRent:       string;
  moveOutDate:      string;
  state:            string;
  lga:              string;
  neighbourhood:    string;
  hasLandlordAgent: boolean;
  landlordConsent:  boolean;
  cautionFee:       string;
  agreementFee:     string;
  extraFees:        ExtraFee[];
};

type Props = {
  data:     StepOneData;
  onChange: (updated: Partial<StepOneData>) => void;
  onNext:   () => void;
};

const ROOM_TYPES = [
  { value: "self-con",  label: "Self Contained" },
  { value: "mini-flat", label: "Mini Flat"       },
  { value: "room",      label: "Single Room"     },
  { value: "1-bed",     label: "1 Bedroom Flat"  },
  { value: "2-bed",     label: "2 Bedroom Flat"  },
];

function getMinDate(): string {
  const d = new Date(); d.setDate(d.getDate() + 4);
  return d.toISOString().split("T")[0];
}
function getMaxDate(): string {
  const d = new Date(); d.setMonth(d.getMonth() + 3);
  return d.toISOString().split("T")[0];
}

export default function StepOne({ data, onChange, onNext }: Props) {
  const states    = STATE_NAMES;
  const lgaList   = data.state ? getLGAs(data.state) : [];
  // Always safe — handles old localStorage drafts without extraFees
  const extraFees = data.extraFees ?? [];

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
  const feeInputStyle: React.CSSProperties = { ...inputStyle, paddingLeft: 28 };

  function updateExtraFee(index: number, field: keyof ExtraFee, value: string) {
    const updated = extraFees.map((f, i) => i === index ? { ...f, [field]: value } : f);
    onChange({ extraFees: updated });
  }

  function addExtraFee() {
    if (extraFees.length >= 2) return;
    onChange({ extraFees: [...extraFees, { name: "", amount: "" }] });
  }

  function removeExtraFee(index: number) {
    onChange({ extraFees: extraFees.filter((_, i) => i !== index) });
  }

  function handleNext() {
    if (!data.roomType)   { toast.error("Select your room type.");   return; }
    if (!data.annualRent || isNaN(Number(data.annualRent)) || Number(data.annualRent) < 10000) {
      toast.error("Enter a valid annual rent (minimum ₦10,000)."); return;
    }
    if (!data.moveOutDate){ toast.error("Select your move-out date."); return; }
    if (!data.state)      { toast.error("Select your state.");        return; }
    if (!data.lga)        { toast.error("Select your LGA.");          return; }
    if (!data.neighbourhood.trim()) { toast.error("Enter your neighbourhood."); return; }
    if (data.cautionFee === "" || isNaN(Number(data.cautionFee))) {
      toast.error("Enter caution fee (enter 0 if none)."); return;
    }
    if (data.agreementFee === "" || isNaN(Number(data.agreementFee))) {
      toast.error("Enter agreement fee (enter 0 if none)."); return;
    }
    for (const fee of extraFees) {
      if (fee.amount && !fee.name.trim()) {
        toast.error("Enter a name for each extra fee."); return;
      }
    }
    onNext();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Room type */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <label style={labelStyle}>Room type</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ROOM_TYPES.map((t) => (
            <button key={t.value} type="button"
              onClick={() => onChange({ roomType: t.value })}
              style={{
                padding: "9px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: "1.5px solid",
                borderColor: data.roomType === t.value ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor: data.roomType === t.value ? "var(--color-primary)" : "var(--color-bg)",
                color: data.roomType === t.value ? "#fff" : "var(--color-text-muted)",
                cursor: "pointer",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Annual rent */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <label style={labelStyle}>Annual rent (₦)</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-muted)", fontWeight: 600 }}>₦</span>
          <input type="number" inputMode="numeric"
            value={data.annualRent}
            onChange={(e) => onChange({ annualRent: e.target.value })}
            placeholder="e.g. 180000"
            style={{ ...inputStyle, paddingLeft: 28 }}
          />
        </div>
        {data.annualRent && Number(data.annualRent) > 0 && (
          <p style={{ fontSize: 11, color: "var(--color-primary)", margin: "6px 0 0", fontWeight: 600 }}>
            Property facilitation fee: ₦{(Number(data.annualRent) * 0.10).toLocaleString("en-NG")}
          </p>
        )}
      </div>

      {/* Move-in fees */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
          Move-in fees <span style={{ color: "#E53935" }}>*</span>
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 14px", lineHeight: 1.6 }}>
          Fees your landlord charges on top of rent. Enter <strong>0</strong> if your landlord does not charge that fee.
          Incoming tenants need this to know their total cost.
        </p>

        {/* Caution fee */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>
            Caution / Security deposit
            <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 4 }}>(refundable when tenant vacates)</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-muted)", fontWeight: 600 }}>₦</span>
            <input type="number" inputMode="numeric"
              value={data.cautionFee ?? ""}
              onChange={(e) => onChange({ cautionFee: e.target.value })}
              placeholder="0"
              style={feeInputStyle}
            />
          </div>
        </div>

        {/* Agreement fee */}
        <div style={{ marginBottom: extraFees.length > 0 ? 12 : 0 }}>
          <label style={labelStyle}>
            Agreement / Legal fee
            <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 4 }}>(one-time, non-refundable)</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-muted)", fontWeight: 600 }}>₦</span>
            <input type="number" inputMode="numeric"
              value={data.agreementFee ?? ""}
              onChange={(e) => onChange({ agreementFee: e.target.value })}
              placeholder="0"
              style={feeInputStyle}
            />
          </div>
        </div>

        {/* Extra fees */}
        {extraFees.map((fee, index) => (
          <div key={index} style={{ marginTop: 12, padding: "12px", borderRadius: 10, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", margin: 0 }}>
                Extra fee {index + 1}
              </p>
              <button type="button" onClick={() => removeExtraFee(index)}
                style={{ fontSize: 11, color: "#C62828", background: "none", border: "none", cursor: "pointer" }}>
                Remove
              </button>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>Fee name</label>
              <input value={fee.name}
                onChange={(e) => updateExtraFee(index, "name", e.target.value)}
                placeholder="e.g. Development levy, Generator fee"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Amount (₦)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--color-text-muted)", fontWeight: 600 }}>₦</span>
                <input type="number" inputMode="numeric"
                  value={fee.amount}
                  onChange={(e) => updateExtraFee(index, "amount", e.target.value)}
                  placeholder="0"
                  style={feeInputStyle}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add fee button */}
        {extraFees.length < 2 && (
          <button type="button" onClick={addExtraFee}
            style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 10, border: "1.5px dashed var(--color-border)", backgroundColor: "transparent", color: "var(--color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Add extra fee
          </button>
        )}
      </div>

      {/* Move-out date */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <label style={labelStyle}>Move-out date</label>
        <input type="date"
          value={data.moveOutDate}
          onChange={(e) => onChange({ moveOutDate: e.target.value })}
          style={inputStyle}
        />
      </div>

      {/* Location */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 14px" }}>
          Location <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-muted)" }}>(shown publicly)</span>
        </p>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>State</label>
          <select value={data.state}
            onChange={(e) => onChange({ state: e.target.value, lga: "" })}
            style={inputStyle}>
            <option value="">Select state</option>
            {states.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>LGA</label>
          <select value={data.lga}
            onChange={(e) => onChange({ lga: e.target.value })}
            disabled={!data.state}
            style={{ ...inputStyle, opacity: data.state ? 1 : 0.5 }}>
            <option value="">Select LGA</option>
            {lgaList.map((l: string) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Neighbourhood / landmark</label>
          <input type="text"
            value={data.neighbourhood}
            onChange={(e) => onChange({ neighbourhood: e.target.value })}
            placeholder="e.g. Near Mobil Housing, off Eket Road"
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
            Do NOT enter your full address here — that goes in Step 3
          </p>
        </div>
      </div>

      {/* Landlord agent */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 3px" }}>
              Does your landlord have an assigned agent?
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
              If yes, the agent may be present during handover.
            </p>
          </div>
          <button type="button"
            onClick={() => onChange({ hasLandlordAgent: !data.hasLandlordAgent })}
            style={{ width: 48, height: 26, borderRadius: 13, border: "none", backgroundColor: data.hasLandlordAgent ? "var(--color-primary)" : "var(--color-border)", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
            <span style={{ position: "absolute", top: 3, left: data.hasLandlordAgent ? 25 : 3, width: 20, height: 20, borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
          </button>
        </div>
      </div>

      {/* Landlord consent */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div onClick={() => onChange({ landlordConsent: !data.landlordConsent })}
          style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `2px solid ${data.landlordConsent ? "var(--color-primary)" : "var(--color-border)"}`, backgroundColor: data.landlordConsent ? "var(--color-primary)" : "transparent", cursor: "pointer", marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {data.landlordConsent && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p onClick={() => onChange({ landlordConsent: !data.landlordConsent })}
          style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6, cursor: "pointer" }}>
          I confirm my landlord or caretaker permits me to find and introduce the next tenant for this room.
        </p>
      </div>

      <button type="button" onClick={handleNext}
        style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
        Continue to Photos →
      </button>
    </div>
  );
}