// src/app/admin/parkout/ambassadors/ambassador-card.tsx
// Client component — ambassador card with revoke action.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateWaLink } from "@/lib/whatsapp-link";

type Props = {
  id:            string;
  name:          string;
  email:         string;
  lga:           string;
  state:         string;
  whatsappNumber?: string;
  totalDeals:    number;
  totalEarned:   number;
  isActive:      boolean;
};

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export default function AmbassadorCard({ id, name, email, lga, state, whatsappNumber, totalDeals, totalEarned, isActive }: Props) {
  const router        = useRouter();
  const [showRevoke,  setShowRevoke]  = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [loading,     setLoading]     = useState(false);

  const waLink = whatsappNumber
    ? generateWaLink(whatsappNumber, `Hi ${name}, this is CorperNest admin.`)
    : null;

  async function handleRevoke() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/parkout/ambassadors/revoke", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambassadorId: id, reason: revokeReason }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }
        toast.success("Ambassador revoked.");
      setShowRevoke(false);
      setRevokeReason("");
      router.refresh();
    } catch { toast.error("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px" }}>{name}</p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
            {lga}, {state} · {email}
          </p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, backgroundColor: isActive ? "#E8F5E9" : "#FFEBEE", color: isActive ? "#15803D" : "#C62828" }}>
          {isActive ? "Active" : "Revoked"}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        {[
          { label: "Deals completed", value: totalDeals ?? 0 },
          { label: "Total earned",    value: formatNaira(totalEarned ?? 0) },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: "center", padding: "8px", borderRadius: 8, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>{stat.value}</p>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 10, backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", textDecoration: "none" }}>
            <span style={{ fontSize: 14 }}>💬</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>WhatsApp</span>
          </a>
        )}
        {isActive && (
          <button onClick={() => setShowRevoke(!showRevoke)}
            style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid #FFCDD2", backgroundColor: "transparent", color: "#C62828", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Revoke
          </button>
        )}
      </div>

      {/* Revoke confirm */}
      {showRevoke && (
        <div style={{ marginTop: 10, padding: "12px", borderRadius: 10, backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#C62828", margin: "0 0 8px" }}>Revoke ambassador?</p>
          <input value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Reason (optional — sent to ambassador)"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 12, border: "1px solid #FFCDD2", backgroundColor: "#fff", outline: "none", boxSizing: "border-box" as const, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowRevoke(false)}
              style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #FFCDD2", backgroundColor: "transparent", color: "#C62828", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleRevoke} disabled={loading}
              style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", backgroundColor: "#C62828", color: "#fff", fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Revoking…" : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}