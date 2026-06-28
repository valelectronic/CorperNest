"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import PropertyCard from "@/components/property-card";

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom",
  "2-bed":     "2 Bedroom",
  "3-bed":     "3 Bedroom",
  "room":      "Single Room",
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  open:    { bg: "#EEF2FF", color: "#3730A3", label: "Searching" },
  matched: { bg: "#FFF8E1", color: "#92400E", label: "Matched"   },
};

interface MatchItem {
  note: string | null;
  listing: {
    id: string; slug: string | null; title: string; price: number;
    lga: string; state: string; type: string; images: string[] | null; status: string;
  };
}

export interface RequestItem {
  id: string; lga: string; state: string; type: string; landmark: string | null;
  minBudget: number | null; maxBudget: number | null; notes: string | null;
  status: string; daysLeft: number; matches: MatchItem[];
}

interface Props {
  requests: RequestItem[];
  onRefetch: () => void;
}

export default function MyRequestsTab({ requests, onRefetch }: Props) {
  const [closingId, setClosingId] = useState<string | null>(null);

  async function handleClose(requestId: string) {
    setClosingId(requestId);
    try {
      const res = await fetch(`/api/property-requests/${requestId}/close`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Could not close request.");
        setClosingId(null);
        return;
      }
      toast.success("Request closed.");
      onRefetch();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setClosingId(null);
    }
  }

  const activeRequests = requests.filter((r) => ["open", "matched"].includes(r.status));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      <Link href="/request-property" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "13px", borderRadius: 14, backgroundColor: "var(--color-primary)",
        color: "#fff", textDecoration: "none", fontFamily: "var(--font-heading)",
        fontWeight: 700, fontSize: 14,
      }}>
        + Request a Property
      </Link>

      {activeRequests.length === 0 && (
        <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 18, padding: "32px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: "0 0 4px" }}>No active requests</p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>Tell us what you're looking for and we'll hunt for it.</p>
        </div>
      )}

      {activeRequests.map((r) => {
        const style = STATUS_STYLE[r.status] ?? STATUS_STYLE.open;
        return (
          <div key={r.id} style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: style.bg, color: style.color }}>
                {style.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                {r.daysLeft === 0 ? "Expires today" : `Expires in ${r.daysLeft}d`}
              </span>
            </div>

            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px" }}>
              {TYPE_LABELS[r.type] ?? r.type} · {r.lga}
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 10px" }}>
              {r.minBudget && r.maxBudget ? `₦${r.minBudget.toLocaleString()} - ₦${r.maxBudget.toLocaleString()}/yr` : "Any budget"}
            </p>

            {r.matches.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                {r.matches.map((m, i) => (
                  <div key={i}>
                    {m.note && (
                      <p style={{ fontSize: 11, color: "#92400E", backgroundColor: "#FFF8E1", padding: "6px 10px", borderRadius: 8, margin: "0 0 6px" }}>
                        Note from agent: {m.note}
                      </p>
                    )}
                    <PropertyCard
                      listing={{
                        id: m.listing.id,
                        slug: m.listing.slug,
                        title: m.listing.title,
                        description: "",
                        lga: m.listing.lga,
                        state: m.listing.state,
                        price: m.listing.price,
                        type: m.listing.type,
                        status: m.listing.status,
                        listingPurpose: "rent",
                        images: m.listing.images,
                        amenities: [],
                        customAmenities: [],
                        createdAt: new Date(),
                      }}
                      isLoggedIn
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => handleClose(r.id)}
              disabled={closingId === r.id}
              style={{ fontSize: 12, color: "var(--color-text-muted)", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", padding: 0 }}
            >
              {closingId === r.id ? "Closing…" : "Found a place elsewhere? Close this request"}
            </button>
          </div>
        );
      })}
    </div>
  );
}