"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RevokeAgentButton({ agentId, agentName }: { agentId: string; agentName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason]         = useState("");
  const [loading, setLoading]       = useState(false);

  async function handleRevoke() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not revoke agent status."); setLoading(false); return; }

      toast.success(`${agentName}'s agent status has been revoked.`);
      setConfirming(false);
      setReason("");
      router.refresh(); // re-fetch server data so the page reflects the change
    } catch {
      toast.error("Network error. Try again.");
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div style={{
        marginTop: 10, padding: "10px 12px", borderRadius: 10,
        background: "#FEF2F2", border: "1px solid #FECACA",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#C62828", margin: "0 0 6px" }}>
          Revoke {agentName}'s agent status?
        </p>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional — shown to the agent)"
          style={{
            width: "100%", padding: "8px 10px", borderRadius: 8,
            border: "1px solid var(--color-border)", fontSize: 12,
            color: "var(--color-text)", background: "var(--color-bg)",
            boxSizing: "border-box", marginBottom: 8,
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setConfirming(false); setReason(""); }}
            disabled={loading}
            style={{
              flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "var(--color-bg)", border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRevoke}
            disabled={loading}
            style={{
              flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "#E53935", border: "none", color: "#fff", cursor: "pointer",
            }}
          >
            {loading ? "Revoking…" : "Confirm Revoke"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        fontSize: 11, fontWeight: 600, color: "#C62828",
        background: "none", border: "none", cursor: "pointer", padding: 0,
        textDecoration: "underline",
      }}
    >
      Revoke agent status
    </button>
  );
}