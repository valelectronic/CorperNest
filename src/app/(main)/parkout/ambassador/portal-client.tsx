// src/app/(main)/parkout/ambassador/portal-client.tsx
// Ambassador portal client — tabs + overview card.
// Added: certificate link card below stats grid

"use client";

import { useState } from "react";
import Link from "next/link";
import AssignedCard from "./assigned-card";

type Ambassador = {
  id:          string;
  lga:         string;
  state:       string;
  isActive:    boolean;
  totalDeals:  number;
  totalEarned: number;
  status:      string;
};

type AssignedListing = {
  id:                   string;
  title:                string;
  roomType:             string;
  state:                string;
  lga:                  string;
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
  status:               string;
};

type CompletedListing = {
  id:          string;
  title:       string;
  lga:         string;
  annualRent:  number | null;
  moveOutDate: Date | string | null;
};

type Props = {
  ambassador:        Ambassador;
  userName:           string;
  assignedListings:   AssignedListing[];
  completedListings: CompletedListing[];
};

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export default function AmbassadorPortalClient({ ambassador, userName, assignedListings, completedListings }: Props) {
  const [tab, setTab] = useState<"active" | "completed">("active");

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100dvh", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ padding: "16px 16px 0", backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Ambassador Portal
          </p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: "0 0 12px" }}>
            Hi {userName.split(" ")[0]} 👋
          </h1>

          {/* Ambassador profile card */}
          <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px" }}>
                  {ambassador.lga} Ambassador
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                  {ambassador.lga}, {ambassador.state}
                </p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: ambassador.isActive ? "#E8F5E9" : "#FFEBEE", color: ambassador.isActive ? "#15803D" : "#C62828" }}>
                {ambassador.isActive ? "Active" : "Suspended"}
              </span>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ textAlign: "center", padding: "10px 8px", borderRadius: 10, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 2px" }}>
                  {ambassador.totalDeals ?? 0}
                </p>
                <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>Deals completed</p>
              </div>
            </div>

            {/* Certificate link */}
            <Link href="/parkout/ambassador/certificate"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textDecoration: "none" }}>
              <span style={{ fontSize: 20 }}>🏆</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Your Ambassador Certificate</p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>Download and share on social media</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--color-border)" }}>
            {([
              { key: "active",    label: `Active (${assignedListings.length})` },
              { key: "completed", label: `Completed (${completedListings.length})` },
            ] as const).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ flex: 1, padding: "10px 8px", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? "var(--color-primary)" : "var(--color-text-muted)", borderBottom: `2px solid ${tab === t.key ? "var(--color-primary)" : "transparent"}`, marginBottom: -2, fontFamily: "var(--font-body)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* Active listings */}
        {tab === "active" && (
          <>
            {assignedListings.length === 0 ? (
              <div style={{ borderRadius: 14, padding: "40px 20px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>🏠</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>No listings assigned yet</p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                  Admin will assign listings in your territory to you soon.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {assignedListings.map((listing) => (
                  <AssignedCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Completed deals */}
        {tab === "completed" && (
          <>
            {completedListings.length === 0 ? (
              <div style={{ borderRadius: 14, padding: "40px 20px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>🤝</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>No completed deals yet</p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                  Completed deals will appear here after admin confirms handover.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {completedListings.map((deal) => (
                  <div key={deal.id} style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>{deal.title}</p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 8px" }}>{deal.lga}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        Rent: {formatNaira(deal.annualRent ?? 0)}/yr
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>
                        Handover confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}