// src/app/(main)/parkout/ambassador/apply/terms.tsx
// Ambassador application terms and conditions component.
// Shown inside the application form before submit button.
// User must tick the checkbox before they can submit.

"use client";

import { useState } from "react";

type Props = {
  agreed:    boolean;
  onAgree:   (val: boolean) => void;
};

export default function AmbassadorTerms({ agreed, onAgree }: Props) {
  const [expanded, setExpanded] = useState(false);

  const terms = [
    {
      title: "Non-refundable vetting fee",
      body:  "The ₦2,000 vetting fee paid to process this application is non-refundable regardless of whether your application is approved or declined.",
    },
    {
      title: "Commission is not guaranteed",
      body:  "Referral commissions are sourced entirely from the property facilitation fee paid by the incoming tenant — not from CorperNest. No commission is paid unless the incoming tenant pays the full facilitation fee AND admin confirms the key handover. CorperNest is not liable for any unpaid commission.",
    },
    {
      title: "Ambassador duties",
      body:  "If approved, you are responsible for calling the outgoing tenant to verify listings, escorting incoming tenants to inspections in your territory, and being present at key handovers.",
    },
    {
      title: "Territory assignment",
      body:  "CorperNest reserves the right to revoke or reassign your territory at any time without prior notice. Territory rights are not transferable.",
    },
    {
      title: "Confidentiality of private listing details",
      body:  "Exact property addresses and landlord contacts are strictly private. You must not share them with anyone other than the booked incoming tenant who has paid the inspection booking fee.",
    },
    {
      title: "Termination",
      body:  "Misuse of access to private listing details, accepting payments outside the platform, or bypassing CorperNest in any transaction will result in immediate termination and possible legal action.",
    },
    {
      title: "Commission split",
      body:  "Approved ambassadors earn 25% of the property facilitation fee per completed handover, plus ₦1,500 from each inspection booking fee. These amounts are non-negotiable.",
    },
  ];

  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid var(--color-border)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "14px 16px",
          backgroundColor: "var(--color-card)", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📄</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
            Ambassador Terms & Conditions
          </p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded terms */}
      {expanded && (
        <div style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-border)" }}>
          {terms.map((term, i) => (
            <div
              key={term.title}
              style={{
                padding: "12px 16px",
                borderBottom: i < terms.length - 1 ? "1px solid var(--color-border)" : "none",
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
                {i + 1}. {term.title}
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
                {term.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Agreement checkbox */}
      <div style={{
        padding: "14px 16px",
        backgroundColor: agreed ? "#E8F5E9" : "var(--color-card)",
        borderTop: "1px solid var(--color-border)",
        display: "flex", alignItems: "flex-start", gap: 12,
        transition: "background 0.2s",
      }}>
        <div
          onClick={() => onAgree(!agreed)}
          style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            border: `2px solid ${agreed ? "#15803D" : "var(--color-border)"}`,
            backgroundColor: agreed ? "#15803D" : "transparent",
            cursor: "pointer", marginTop: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {agreed && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p
          onClick={() => onAgree(!agreed)}
          style={{ fontSize: 13, color: agreed ? "#15803D" : "var(--color-text-muted)", margin: 0, lineHeight: 1.6, cursor: "pointer", fontWeight: agreed ? 600 : 400 }}
        >
          I have read and agree to the Ambassador Terms & Conditions. I understand that commissions are only paid after confirmed handovers and sourced from incoming tenant payments.
        </p>
      </div>
    </div>
  );
}