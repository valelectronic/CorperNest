// src/app/admin/marketplace/disputes/disputes-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Dispute = {
  id:           string;
  listingId:    string;
  amount:       number;
  sellerPayout: number;
  status:       string;
  paystackRef:  string | null;
  paidAt:       Date | string | null;
  createdAt:    Date | string;
  listingTitle: string;
  sellerName:   string | null;
  sellerPhone:  string | null;
  buyerName:    string | null;
  buyerPhone:   string | null;
};

export default function AdminDisputesClient({ disputes }: { disputes: Dispute[] }) {
  const router  = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: "release" | "refund" } | null>(null);

  async function handleResolve(id: string, action: "release" | "refund") {
    setActing(id);
    try {
      const res  = await fetch(`/api/admin/marketplace/disputes/${id}/resolve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }
      toast.success(action === "release"
        ? "Payment released to seller."
        : "Buyer refund initiated — process via Paystack dashboard."
      );
      setConfirm(null);
      router.refresh();
    } catch { toast.error("Network error."); }
    finally   { setActing(null); }
  }

  if (disputes.length === 0) {
    return (
      <div style={{ padding: "20px 16px", maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: "0 0 20px" }}>Disputes</h1>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🕊️</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>No active disputes</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: "0 0 2px" }}>Disputes</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{disputes.length} active — call both parties first</p>
      </div>

      <div style={{ padding: "10px 14px", borderRadius: 12, backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: "#C62828", margin: 0, lineHeight: 1.6 }}>
          ⚠️ Call both buyer and seller before resolving. Understand what happened. Payment is frozen until you resolve.
        </p>
      </div>

      {disputes.map((d) => (
        <div key={d.id} style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1.5px solid #FCA5A5", overflow: "hidden", marginBottom: 12 }}>
          <div style={{ padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.listingTitle}
              </p>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: "#FEF2F2", color: "#C62828", flexShrink: 0, marginLeft: 8 }}>
                🚨 Disputed
              </span>
            </div>

            {/* Amounts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <div style={{ padding: "10px", borderRadius: 10, backgroundColor: "#FEF2F2", textAlign: "center" }}>
                <p style={{ fontSize: 10, color: "#C62828", margin: "0 0 2px" }}>Amount frozen</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#C62828", margin: 0, fontFamily: "var(--font-heading)" }}>₦{d.amount.toLocaleString()}</p>
              </div>
              <div style={{ padding: "10px", borderRadius: 10, backgroundColor: "#E8F5E9", textAlign: "center" }}>
                <p style={{ fontSize: 10, color: "#2E7D32", margin: "0 0 2px" }}>Seller gets if released</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#15803D", margin: 0, fontFamily: "var(--font-heading)" }}>₦{d.sellerPayout.toLocaleString()}</p>
              </div>
            </div>

            {/* Both parties — tap to call */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)" }}>
                <div>
                  <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px" }}>BUYER</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{d.buyerName ?? "—"}</p>
                </div>
                {d.buyerPhone && (
                  <a href={`tel:${d.buyerPhone}`}
                    style={{ padding: "10px 16px", borderRadius: 10, backgroundColor: "var(--color-primary)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                    📞 Call
                  </a>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)" }}>
                <div>
                  <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px" }}>SELLER</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{d.sellerName ?? "—"}</p>
                </div>
                {d.sellerPhone && (
                  <a href={`tel:${d.sellerPhone}`}
                    style={{ padding: "10px 16px", borderRadius: 10, backgroundColor: "var(--color-primary)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                    📞 Call
                  </a>
                )}
              </div>
            </div>

            {d.paystackRef && (
              <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 12px", fontFamily: "monospace" }}>Ref: {d.paystackRef}</p>
            )}

            {/* Resolution buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setConfirm({ id: d.id, action: "release" })}
                style={{ padding: "12px", borderRadius: 12, border: "none", backgroundColor: "#15803D", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✅ Release to seller
              </button>
              <button onClick={() => setConfirm({ id: d.id, action: "refund" })}
                style={{ padding: "12px", borderRadius: 12, border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", color: "#C62828", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ↩ Refund buyer
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Confirm resolution modal */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--color-header)", margin: "0 0 8px" }}>
              {confirm.action === "release" ? "Release payment to seller?" : "Refund buyer?"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
              {confirm.action === "release"
                ? "This releases the frozen payment to the seller. Make the transfer via Paystack dashboard and mark it done."
                : "This marks the dispute as refunded. You must manually process the refund via Paystack dashboard."}
            </p>
            <button onClick={() => handleResolve(confirm.id, confirm.action)} disabled={acting === confirm.id}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", backgroundColor: confirm.action === "release" ? "#15803D" : "#C62828", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 8 }}>
              {acting === confirm.id ? "Processing…" : confirm.action === "release" ? "Yes, release to seller" : "Yes, refund buyer"}
            </button>
            <button onClick={() => setConfirm(null)}
              style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}