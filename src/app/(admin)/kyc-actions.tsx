"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function KycActions({ agentId, requestId }: { agentId: string; requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [declineNote, setDeclineNote] = useState("");

  async function handleApprove() {
    setLoading("approve");
    try {
      const res = await fetch("/api/admin/kyc/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, requestId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Agent approved!");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function handleDecline() {
    if (!declineNote.trim()) { toast.error("Please enter a reason"); return; }
    setLoading("decline");
    try {
      const res = await fetch("/api/admin/kyc/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, requestId, note: declineNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Request declined");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(null);
      setShowDeclineInput(false);
      setDeclineNote("");
    }
  }

  if (showDeclineInput) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea
          value={declineNote}
          onChange={(e) => setDeclineNote(e.target.value)}
          placeholder="Reason for declining (agent will see this)..."
          rows={2}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: "1.5px solid #FECACA", fontSize: 13,
            color: "var(--color-text)", background: "var(--color-bg)",
            boxSizing: "border-box", fontFamily: "var(--font-body)",
            resize: "none",
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleDecline}
            disabled={loading === "decline"}
            style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none",
              background: "#C62828", color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: "var(--font-heading)", cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading === "decline" ? "Declining…" : "Confirm Decline"}
          </button>
          <button
            onClick={() => { setShowDeclineInput(false); setDeclineNote(""); }}
            style={{
              padding: "10px 16px", borderRadius: 10,
              border: "1px solid var(--color-border)", background: "var(--color-bg)",
              color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={handleApprove}
        disabled={!!loading}
        style={{
          flex: 1, padding: "11px", borderRadius: 10, border: "none",
          background: "var(--color-primary)", color: "#fff",
          fontSize: 13, fontWeight: 700, fontFamily: "var(--font-heading)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading === "approve" ? "Approving…" : "✓ Approve"}
      </button>
      <button
        onClick={() => setShowDeclineInput(true)}
        disabled={!!loading}
        style={{
          flex: 1, padding: "11px", borderRadius: 10,
          border: "1px solid #FECACA", background: "#FEF2F2",
          color: "#C62828", fontSize: 13, fontWeight: 700,
          fontFamily: "var(--font-heading)", cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        ✕ Decline
      </button>
    </div>
  );
}