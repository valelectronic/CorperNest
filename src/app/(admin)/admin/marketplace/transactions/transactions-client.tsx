// src/app/admin/marketplace/transactions/transactions-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Txn = {
  id:           string;
  listingId:    string;
  amount:       number;
  commission:   number;
  sellerPayout: number;
  status:       string;
  paystackRef:  string | null;
  paidAt:       Date | string | null;
  confirmedAt:  Date | string | null;
  releasedAt:   Date | string | null;
  listingTitle: string;
  sellerName:   string | null;
  sellerPhone:  string | null;
  buyerName:    string | null;
  buyerPhone:   string | null;
};

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: "Pending",     bg: "#F3F4F6", color: "#6B7280" },
  escrow:   { label: "In Escrow",   bg: "#EEF2FF", color: "#4338CA" },
  released: { label: "Paid out",    bg: "#E8F5E9", color: "#2E7D32" },
  disputed: { label: "Disputed",    bg: "#FEF2F2", color: "#C62828" },
  refunded: { label: "Refunded",    bg: "#F3F4F6", color: "#6B7280" },
};

function fmt(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminTransactionsClient({ transactions }: { transactions: Txn[] }) {
  const router  = useRouter();
  const [marking,    setMarking]    = useState<string | null>(null);

  async function markReleased(id: string) {
    setMarking(id);
    try {
      const res  = await fetch(`/api/admin/marketplace/transactions/${id}/release`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }
      toast.success("Payout marked as sent.");
      router.refresh();
    } catch { toast.error("Network error."); }
    finally   { setMarking(null); }
  }

  const needPayout  = transactions.filter((t) => t.status === "escrow" && t.confirmedAt);
  const inEscrow    = transactions.filter((t) => t.status === "escrow" && !t.confirmedAt);
  const pending     = transactions.filter((t) => t.status === "pending");
  const released    = transactions.filter((t) => t.status === "released");
  const others      = transactions.filter((t) => !["escrow", "released", "pending"].includes(t.status));

  function TxnCard({ t }: { t: Txn }) {
    const cfg = STATUS[t.status] ?? STATUS.pending;
    return (
      <div style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden", marginBottom: 10 }}>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.listingTitle}
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0 }}>
              {cfg.label}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{ padding: "8px 10px", borderRadius: 10, backgroundColor: "var(--color-light)", textAlign: "center" }}>
              <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Paid</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", margin: 0, fontFamily: "var(--font-heading)" }}>₦{t.amount.toLocaleString()}</p>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 10, backgroundColor: "#E8F5E9", textAlign: "center" }}>
              <p style={{ fontSize: 10, color: "#2E7D32", margin: "0 0 2px" }}>Payout</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#15803D", margin: 0, fontFamily: "var(--font-heading)" }}>₦{t.sellerPayout.toLocaleString()}</p>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 10, backgroundColor: "var(--color-light)", textAlign: "center" }}>
              <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Fee</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", margin: 0, fontFamily: "var(--font-heading)" }}>₦{t.commission.toLocaleString()}</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "var(--color-text-muted)", width: 36 }}>Buyer</span>
              <span style={{ fontSize: 11, color: "var(--color-text)" }}>{t.buyerName ?? "—"}</span>
              {t.buyerPhone && <a href={`tel:${t.buyerPhone}`} style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none" }}>📞 {t.buyerPhone}</a>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "var(--color-text-muted)", width: 36 }}>Seller</span>
              <span style={{ fontSize: 11, color: "var(--color-text)" }}>{t.sellerName ?? "—"}</span>
              {t.sellerPhone && <a href={`tel:${t.sellerPhone}`} style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none" }}>📞 {t.sellerPhone}</a>}
            </div>
          </div>
          {t.paystackRef && (
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0, fontFamily: "monospace" }}>Ref: {t.paystackRef}</p>
          )}
          {t.confirmedAt && <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "4px 0 0" }}>Buyer confirmed: {fmt(t.confirmedAt)}</p>}
          {t.releasedAt  && <p style={{ fontSize: 10, color: "#15803D", margin: "4px 0 0", fontWeight: 600 }}>Paid out: {fmt(t.releasedAt)}</p>}
        </div>
        {t.status === "escrow" && t.confirmedAt && (
          <div style={{ padding: "0 14px 12px" }}>
            <button onClick={() => markReleased(t.id)} disabled={marking === t.id}
              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", backgroundColor: "#15803D", color: "#fff", fontSize: 13, fontWeight: 700, cursor: marking === t.id ? "not-allowed" : "pointer", opacity: marking === t.id ? 0.7 : 1 }}>
              {marking === t.id ? "Marking…" : `💰 Mark payout sent — ₦${t.sellerPayout.toLocaleString()}`}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: "0 0 2px" }}>Transactions</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{transactions.length} total · {needPayout.length} need payout</p>
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ padding: "8px 12px", borderRadius: 10, backgroundColor: "#F3F4F6", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ⏳ Awaiting payment — {pending.length}
            </p>
          </div>
          {pending.map((t) => <TxnCard key={t.id} t={t} />)}
        </div>
      )}

      {needPayout.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ padding: "8px 12px", borderRadius: 10, backgroundColor: "#FFF8E1", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#92400E", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              💰 Payout required — {needPayout.length}
            </p>
          </div>
          {needPayout.map((t) => <TxnCard key={t.id} t={t} />)}
        </div>
      )}

      {inEscrow.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ padding: "8px 12px", borderRadius: 10, backgroundColor: "#EEF2FF", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#4338CA", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              🔒 In escrow — {inEscrow.length}
            </p>
          </div>
          {inEscrow.map((t) => <TxnCard key={t.id} t={t} />)}
        </div>
      )}

      {released.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ padding: "8px 12px", borderRadius: 10, backgroundColor: "#E8F5E9", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#2E7D32", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ✅ Completed — {released.length}
            </p>
          </div>
          {released.map((t) => <TxnCard key={t.id} t={t} />)}
        </div>
      )}

      {others.length > 0 && (
        <div>
          <div style={{ padding: "8px 12px", borderRadius: 10, backgroundColor: "var(--color-light)", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Other — {others.length}</p>
          </div>
          {others.map((t) => <TxnCard key={t.id} t={t} />)}
        </div>
      )}

      {transactions.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>No transactions yet</p>
        </div>
      )}
    </div>
  );
}