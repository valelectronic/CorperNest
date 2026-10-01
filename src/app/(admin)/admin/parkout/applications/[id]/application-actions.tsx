// src/app/admin/parkout/applications/[id]/application-actions.tsx
// Client component — approve or reject an ambassador application.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = { applicationId: string; userId: string };

export default function ApplicationActions({ applicationId, userId }: Props) {
  const router = useRouter();
  const [loading,       setLoading]       = useState(false);
  const [showReject,    setShowReject]    = useState(false);
  const [rejectReason,  setRejectReason]  = useState("");

  async function callAction(endpoint: string, body: object) {
    setLoading(true);
    try {
      const res  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Action failed."); return; }
      toast.success("Done ✓");
      router.refresh();
    } catch { toast.error("Network error. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
        Admin actions
      </p>

      {!showReject && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => callAction("/api/admin/parkout/applications/approve", { applicationId, userId })} disabled={loading}
            style={{ padding: "11px 16px", borderRadius: 10, border: "none", backgroundColor: loading ? "var(--color-border)" : "#15803D", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            ✓ Approve application
          </button>
          <button onClick={() => setShowReject(true)} disabled={loading}
            style={{ padding: "11px 16px", borderRadius: 10, border: "none", backgroundColor: loading ? "var(--color-border)" : "#C62828", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            ✗ Reject application
          </button>
        </div>
      )}

      {showReject && (
        <div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (sent to applicant)"
            rows={3}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)", outline: "none", boxSizing: "border-box" as const, resize: "none" as const, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowReject(false)}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => callAction("/api/admin/parkout/applications/reject", { applicationId, userId, reason: rejectReason })} disabled={loading}
              style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", backgroundColor: "#C62828", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              Confirm rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}