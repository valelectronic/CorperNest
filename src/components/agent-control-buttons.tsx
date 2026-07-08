// src/components/agent-control-buttons.tsx
// Client component — two simple manual controls for commission enforcement.
// Used in the admin agents page alongside the existing RevokeAgentButton.

"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AgentControlButtons({ agentId }: { agentId: string }) {
  const [hiding,    setHiding]    = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [hidden,    setHidden]    = useState(false);

  async function callControl(action: "hide-listings" | "release-listings" | "send-reminder") {
    if (action === "hide-listings")    setHiding(true);
    if (action === "release-listings") setReleasing(true);
    if (action === "send-reminder")    setReminding(true);

    try {
      const res  = await fetch(`/api/admin/agents/${agentId}/controls`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Action failed"); return; }

      if (action === "hide-listings")    { toast.success("Listings hidden — agent notified"); setHidden(true); }
      if (action === "release-listings") { toast.success("Listings restored — agent notified"); setHidden(false); }
      if (action === "send-reminder")    { toast.success("Reminder sent to agent"); }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setHiding(false);
      setReleasing(false);
      setReminding(false);
    }
  }

  return (
    <>
      {/* Send reminder */}
      <button
        onClick={() => callControl("send-reminder")}
        disabled={reminding}
        style={{
          padding: "7px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600,
          background: "#FFF8E1", border: "1px solid #FAC775", color: "#92400E",
          cursor: reminding ? "not-allowed" : "pointer",
          opacity: reminding ? 0.6 : 1,
        }}
      >
        {reminding ? "Sending…" : "💬 Remind to Pay"}
      </button>

      {/* Hide / Release listings toggle */}
      {!hidden ? (
        <button
          onClick={() => callControl("hide-listings")}
          disabled={hiding}
          style={{
            padding: "7px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600,
            background: "#FEF2F2", border: "1px solid #FECACA", color: "#C62828",
            cursor: hiding ? "not-allowed" : "pointer",
            opacity: hiding ? 0.6 : 1,
          }}
        >
          {hiding ? "Hiding…" : "🚫 Hide Listings"}
        </button>
      ) : (
        <button
          onClick={() => callControl("release-listings")}
          disabled={releasing}
          style={{
            padding: "7px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600,
            background: "#E8F5E9", border: "1px solid #A5D6A7", color: "#2E7D32",
            cursor: releasing ? "not-allowed" : "pointer",
            opacity: releasing ? 0.6 : 1,
          }}
        >
          {releasing ? "Releasing…" : "✓ Release Listings"}
        </button>
      )}
    </>
  );
}