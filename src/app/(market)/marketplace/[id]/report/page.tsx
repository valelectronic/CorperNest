// src/app/(market)/marketplace/[id]/report/page.tsx
// Buyer reports a suspicious or policy-violating listing.
// Requires login. Admin gets notified via push.
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const REASONS = [
  { value: "scam",        label: "🚨 This looks like a scam" },
  { value: "wrong-price", label: "💰 Price is misleading or wrong" },
  { value: "wrong-photos",label: "📸 Photos don't match the item" },
  { value: "already-sold",label: "✓ Item is already sold" },
  { value: "prohibited",  label: "🚫 Item is prohibited or illegal" },
  { value: "duplicate",   label: "📋 Duplicate listing" },
  { value: "other",       label: "💬 Other reason" },
];

export default function ReportListingPage() {
  const params   = useParams();
  const router   = useRouter();
  const listingId = params.id as string;

  const [reason,      setReason]      = useState("");
  const [details,     setDetails]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  async function handleSubmit() {
    if (!reason) { toast.error("Select a reason."); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/marketplace/listings/${listingId}/report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not submit report. Try again."); return; }
      setSubmitted(true);
    } catch { toast.error("Network error. Try again."); }
    finally   { setSubmitting(false); }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", gap: 16, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 56 }}>✅</div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: 0, textAlign: "center" }}>
          Report received
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
          Thank you for keeping CorperNest safe. Our team will review this listing within 24 hours.
        </p>
        <button onClick={() => router.back()}
          style={{ padding: "13px 28px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 56, zIndex: 30, padding: "12px 16px", backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>Report Listing</p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>Help us keep CorperNest safe</p>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Reason selection */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>
            What is wrong with this listing?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {REASONS.map((r) => (
              <button key={r.value} onClick={() => setReason(r.value)}
                style={{ padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${reason === r.value ? "var(--color-primary)" : "var(--color-border)"}`, backgroundColor: reason === r.value ? "var(--color-light)" : "var(--color-card)", color: reason === r.value ? "var(--color-primary)" : "var(--color-text)", fontSize: 14, fontWeight: reason === r.value ? 700 : 500, cursor: "pointer", textAlign: "left" }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional details */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>
            Additional details <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
          </p>
          <textarea value={details} onChange={(e) => setDetails(e.target.value.slice(0, 300))} rows={4}
            placeholder="Describe the issue in more detail to help our team investigate..."
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 13, resize: "none", boxSizing: "border-box", backgroundColor: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}
          />
          <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "4px 0 0", textAlign: "right" }}>{details.length}/300</p>
        </div>

        <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
            🔒 Your report is anonymous. The seller will not know you reported them. Our team reviews all reports within 24 hours.
          </p>
        </div>

        <button onClick={handleSubmit} disabled={submitting || !reason}
          style={{ padding: "15px", borderRadius: 14, border: "none", backgroundColor: !reason ? "var(--color-border)" : "#C62828", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: !reason ? "not-allowed" : "pointer", opacity: submitting ? 0.8 : 1 }}>
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </div>
    </div>
  );
}