"use client";

import { useState } from "react";
import { toast } from "sonner";

type Receipt = {
  id:             string;
  bookingId:      string;
  rentAmount:     number;
  durationMonths: number;
  paymentDate:    Date | string;
  renewalDate:    Date | string;
  receiptUrl:     string;
  feePaid:        boolean;
  receiptStatus:  string;
  adminNote:      string | null;
  createdAt:      Date | string;
  renterName:     string;
  renterEmail:    string;
  listingTitle:   string;
  listingLga:     string;
};

type Props = { receipts: Receipt[] };

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:  { bg: "#FFF8E1", color: "#B45309" },
    approved: { bg: "#E8F5E9", color: "#2E7D32" },
    flagged:  { bg: "#FFEBEE", color: "#C62828" },
  };
  const s = map[status] ?? { bg: "#F5F5F5", color: "#666" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, textTransform: "capitalize", flexShrink: 0 }}>
      {status}
    </span>
  );
}

export default function AdminReceiptsClient({ receipts }: Props) {
  const [items,         setItems]         = useState(receipts);
  const [processingId,  setProcessingId]  = useState<string | null>(null);
  const [flagTarget,    setFlagTarget]    = useState<Receipt | null>(null);
  const [flagReason,    setFlagReason]    = useState("");
  const [activeFilter,  setActiveFilter]  = useState<"all" | "pending" | "approved" | "flagged">("pending");

  const filtered = items.filter((r) => activeFilter === "all" || r.receiptStatus === activeFilter);
  const pendingCount = items.filter((r) => r.receiptStatus === "pending").length;

  async function handleApprove(id: string) {
    setProcessingId(id);
    try {
      const res  = await fetch("/api/admin/receipts/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentRecordId: id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, receiptStatus: "approved" } : r));
      toast.success("Receipt approved.");
    } catch {
      toast.error("Network error.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleFlagSubmit() {
    if (!flagTarget) return;
    if (flagReason.trim().length < 5) { toast.error("Enter a reason (min 5 characters)"); return; }
    setProcessingId(flagTarget.id);
    try {
      const res  = await fetch("/api/admin/receipts/flag", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentRecordId: flagTarget.id, reason: flagReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      const id = flagTarget.id;
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, receiptStatus: "flagged", adminNote: flagReason.trim() } : r));
      setFlagTarget(null);
      setFlagReason("");
      toast.success("Receipt flagged. Client notified.");
    } catch {
      toast.error("Network error.");
    } finally {
      setProcessingId(null);
    }
  }

  const tabs = [
    { key: "pending",  label: "Pending",  count: items.filter(r => r.receiptStatus === "pending").length  },
    { key: "approved", label: "Approved", count: items.filter(r => r.receiptStatus === "approved").length },
    { key: "flagged",  label: "Flagged",  count: items.filter(r => r.receiptStatus === "flagged").length  },
    { key: "all",      label: "All",      count: items.length },
  ] as const;

  return (
    <div style={{ padding: "24px 16px 64px", maxWidth: 800, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Rent Receipts
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          Review and approve client rent payment receipts
        </p>
      </div>

      {/* Alert */}
      {pendingCount > 0 && (
        <div style={{ background: "#FFF8E1", border: "1px solid #FAC775", borderRadius: 12, padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="#B45309" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#92400E" }}>
            {pendingCount} receipt{pendingCount !== 1 ? "s" : ""} awaiting review
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveFilter(t.key)}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              fontFamily: "var(--font-heading)", border: "1px solid",
              whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0,
              borderColor: activeFilter === t.key ? "var(--color-primary)" : "var(--color-border)",
              background:  activeFilter === t.key ? "var(--color-primary)" : "var(--color-card)",
              color:       activeFilter === t.key ? "#fff" : "var(--color-text-muted)",
            }}>
            {t.label} {t.count > 0 && `· ${t.count}`}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>No {activeFilter === "all" ? "" : activeFilter} receipts</p>
        </div>
      )}

      {/* Receipt cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((r) => {
          const isProcessing = processingId === r.id;
          return (
            <div key={r.id} style={{
              background: "var(--color-card)", border: "1px solid var(--color-border)",
              borderRadius: 18, overflow: "hidden",
              opacity: isProcessing ? 0.6 : 1, transition: "opacity 0.2s",
            }}>
              {/* Top strip */}
              <div style={{ height: 3, background: r.receiptStatus === "approved" ? "#43A047" : r.receiptStatus === "flagged" ? "#E53935" : "#F59E0B" }} />

              <div style={{ padding: 16 }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.renterName}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{r.renterEmail}</p>
                  </div>
                  <StatusBadge status={r.receiptStatus} />
                </div>

                {/* Property */}
                <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--color-border)", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>Property</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{r.listingTitle}</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "2px 0 0" }}>{r.listingLga}</p>
                </div>

                {/* Details grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Rent Paid",   value: formatNaira(r.rentAmount) },
                    { label: "Duration",    value: r.durationMonths === 6 ? "6 months" : r.durationMonths === 12 ? "1 year" : "2 years" },
                    { label: "Paid On",     value: formatDate(r.paymentDate) },
                    { label: "Renewal",     value: formatDate(r.renewalDate) },
                    { label: "Submitted",   value: formatDate(r.createdAt) },
                  ].map((d) => (
                    <div key={d.label} style={{ background: "var(--color-bg)", borderRadius: 10, padding: "8px 10px", border: "1px solid var(--color-border)" }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>{d.label}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Admin note if flagged */}
                {r.receiptStatus === "flagged" && r.adminNote && (
                  <div style={{ background: "#FFEBEE", borderRadius: 10, padding: "10px 12px", border: "1px solid #FECACA", marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#C62828", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>Flag reason</p>
                    <p style={{ fontSize: 13, color: "#C62828", margin: 0, lineHeight: 1.5 }}>{r.adminNote}</p>
                  </div>
                )}

                {/* View receipt + actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none", padding: "8px 14px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                    View receipt
                  </a>

                  {r.receiptStatus === "pending" && (
                    <>
                      <button onClick={() => setFlagTarget(r)} disabled={isProcessing}
                        style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "#FEF2F2", border: "1px solid #FECACA", color: "#C62828", cursor: "pointer", fontFamily: "var(--font-heading)" }}>
                        Flag
                      </button>
                      <button onClick={() => handleApprove(r.id)} disabled={isProcessing}
                        style={{ flex: 2, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "var(--color-primary)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-heading)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {isProcessing ? (
                          <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Approve
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {r.receiptStatus === "flagged" && (
                    <button onClick={() => handleApprove(r.id)} disabled={isProcessing}
                      style={{ flex: 1, padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "var(--color-primary)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-heading)" }}>
                      Approve re-upload
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flag bottom sheet backdrop */}
      {flagTarget && (
        <div onClick={() => { setFlagTarget(null); setFlagReason(""); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      )}

      {/* Flag bottom sheet */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        background: "var(--color-card)", borderRadius: "22px 22px 0 0",
        transform: flagTarget ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        maxWidth: 800, margin: "0 auto",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
        </div>
        <div style={{ padding: "0 16px 24px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--color-header)", margin: "0 0 4px" }}>Flag receipt</p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
            {flagTarget?.renterName} · {flagTarget?.listingTitle}
          </p>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Reason *
          </label>
          <textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)}
            placeholder="e.g. Receipt image is blurry, please upload a clearer photo"
            rows={4}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, border: "1.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", resize: "vertical", fontFamily: "var(--font-body)", boxSizing: "border-box", lineHeight: 1.5, outline: "none" }} />
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 16px" }}>
            Client will be notified and can re-upload at no extra charge.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setFlagTarget(null); setFlagReason(""); }}
              style={{ flex: 1, padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleFlagSubmit} disabled={processingId === flagTarget?.id}
              style={{ flex: 2, padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 700, background: "#C62828", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-heading)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {processingId === flagTarget?.id ? (
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              ) : "Flag & Notify Client"}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}