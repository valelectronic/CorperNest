// src/app/(main)/parkout/ambassador/assigned-card.tsx
// Single assigned listing card for ambassador portal.
// Shows all private details — address, caretaker, tenant.
// Includes verify button and WhatsApp link to outgoing tenant.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateWaLink } from "@/lib/whatsapp-link";

type Listing = {
  id:                   string;
  title:                string;
  roomType:             string;
  lga:                  string;
  state:                string;
  neighbourhood:        string;
  annualRent:           number;
  facilitationFee:      number;
  moveOutDate:          Date | string | null;
  images:               string[];
  description:          string | null;
  landlordRules:        string | null;
  exactAddress:         string | null;
  landlordName:         string | null;
  landlordPhone:        string | null;
  tenantName:           string;
  tenantEmail:          string;
  transportEstimates:   Array<{ name: string; bikeCost: number; kekeCost: number }> | null;
  moveInFees:           { cautionFee: number; agreementFee: number; extraFees: Array<{ name: string; amount: number }> } | null;
  verifiedByAmbassador: boolean;
  verifiedAt:           Date | string | null;
};

function fmt(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

function getDaysLeft(moveOutDate: Date | string | null): number | null {
  if (!moveOutDate) return null;
  const diff = new Date(moveOutDate).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.floor(diff / 86400000);
}

export default function AssignedCard({ listing }: { listing: Listing }) {
  const router       = useRouter();
  const [expanded,   setExpanded]   = useState(false);
  const [verifying,  setVerifying]  = useState(false);
  const [verified,   setVerified]   = useState(listing.verifiedByAmbassador);

  const daysLeft = getDaysLeft(listing.moveOutDate);

  // WhatsApp link to message outgoing tenant
  const waLink = listing.landlordPhone
    ? generateWaLink(
        listing.landlordPhone,
        `Hi ${listing.tenantName}, I am the CorperNest Ambassador assigned to your listing near ${listing.neighbourhood}, ${listing.lga}.\n\nI will like to verify your listing details and arrange an inspection. Please let me know when you are available.`
      )
    : null;

  async function handleVerify() {
    setVerifying(true);
    try {
      const res  = await fetch("/api/parkout/ambassador/verify-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed. Try again."); return; }
      setVerified(true);
      toast.success("Listing marked as verified ✓");
      router.refresh();
    } catch { toast.error("Network error. Try again."); }
    finally { setVerifying(false); }
  }

  const urgencyColor = daysLeft === null ? "var(--color-primary)"
    : daysLeft < 3 ? "#C62828"
    : daysLeft < 7 ? "#F59E0B"
    : "var(--color-primary)";

  const urgencyBg = daysLeft === null ? "var(--color-light)"
    : daysLeft < 3 ? "#FFEBEE"
    : daysLeft < 7 ? "#FFF8E1"
    : "var(--color-light)";

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>

      {/* Photo strip */}
      {listing.images?.length > 0 && (
        <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
          <img src={listing.images[0]} alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {verified && (
            <div style={{ position: "absolute", top: 10, right: 10, backgroundColor: "#15803D", borderRadius: 20, padding: "3px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>Verified</span>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "14px 16px" }}>

        {/* Title + countdown */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px" }}>{listing.title}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{listing.neighbourhood}, {listing.lga}</p>
          </div>
          {daysLeft !== null && (
            <div style={{ textAlign: "center", padding: "6px 10px", borderRadius: 10, backgroundColor: urgencyBg, flexShrink: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 900, color: urgencyColor, margin: 0, fontFamily: "var(--font-heading)", lineHeight: 1 }}>{daysLeft}</p>
              <p style={{ fontSize: 9, color: urgencyColor, margin: 0, fontWeight: 600 }}>days left</p>
            </div>
          )}
        </div>

        {/* Rent + facilitation fee */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Annual rent</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{fmt(listing.annualRent)}</p>
          </div>
          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Facilitation fee</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{fmt(listing.facilitationFee)}</p>
          </div>
        </div>

        {/* Private details — always visible to ambassador */}
        <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "#FFF8E1", border: "1px solid #FAC775", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#92400E", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            🔒 Private details
          </p>
          {[
            { label: "Exact address",   value: listing.exactAddress  ?? "—" },
            { label: "Caretaker",       value: listing.landlordName  ?? "—" },
            { label: "Caretaker phone", value: listing.landlordPhone ?? "—" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#92400E", width: 110, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#78350F" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Outgoing tenant */}
        <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Outgoing tenant
          </p>
          {[
            { label: "Name",  value: listing.tenantName  },
            { label: "Email", value: listing.tenantEmail },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)", width: 110, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Expand for more details */}
        <button onClick={() => setExpanded(!expanded)}
          style={{ width: "100%", padding: "9px", borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>
          {expanded ? "Hide details ↑" : "See landlord rules & transport ↓"}
        </button>

        {expanded && (
          <div style={{ marginBottom: 10 }}>
            {/* Landlord rules */}
            {listing.landlordRules && (
              <div style={{ borderRadius: 10, padding: "10px 12px", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Landlord rules</p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>{listing.landlordRules}</p>
              </div>
            )}

            {/* Transport estimates */}
            {listing.transportEstimates && listing.transportEstimates.length > 0 && (
              <div style={{ borderRadius: 10, padding: "10px 12px", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>Transport estimates</p>
                {listing.transportEstimates.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{t.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>🚲 ₦{t.bikeCost} · 🛺 ₦{t.kekeCost}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Move-in fees */}
            {listing.moveInFees && (
              <div style={{ borderRadius: 10, padding: "10px 12px", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>Move-in fees</p>
                {[
                  { label: "Caution deposit", amount: listing.moveInFees.cautionFee },
                  { label: "Agreement fee",   amount: listing.moveInFees.agreementFee },
                  ...(listing.moveInFees.extraFees ?? []).map((f) => ({ label: f.name, amount: f.amount })),
                ].map((fee, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{fee.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: fee.amount === 0 ? "var(--color-text-muted)" : "var(--color-text)" }}>
                      {fee.amount === 0 ? "None" : `₦${fee.amount.toLocaleString("en-NG")}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* WhatsApp outgoing tenant */}
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 12, backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", textDecoration: "none" }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>WhatsApp</span>
            </a>
          )}

          {/* Verify listing */}
          {!verified ? (
            <button onClick={handleVerify} disabled={verifying}
              style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", backgroundColor: verifying ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: verifying ? "not-allowed" : "pointer", fontFamily: "var(--font-heading)" }}>
              {verifying ? "Verifying…" : "✓ Mark as verified"}
            </button>
          ) : (
            <div style={{ flex: 2, padding: "11px", borderRadius: 12, backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>Verified</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}