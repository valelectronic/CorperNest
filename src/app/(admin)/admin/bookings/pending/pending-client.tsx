// src/app/admin/bookings/pending/pending-client.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

type PendingRequest = {
  id:              string;
  status:          string;
  termsAcceptedAt: Date;
  clientId:        string;
  clientName:      string;
  clientEmail:     string;
  clientPhone:     string | null;
  listingId:       string;
  listingTitle:    string;
  listingType:     string;
  listingLga:      string;
  listingState:    string;
  listingLandmark: string | null;
  listingPrice:    number;
  listingImages:   string[] | null;
  agentId:         string;
  agentName:       string;
  agentPhone:      string | null;
};

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom",
  "2-bed":     "2 Bedroom",
  "3-bed":     "3 Bedroom",
  "room":      "Single Room",
};

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminPendingBookingsClient({
  requests,
}: {
  requests: PendingRequest[];
}) {
  const [items, setItems]               = useState(requests);
  const [actingOn, setActingOn]         = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<PendingRequest | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  async function handleApprove(req: PendingRequest) {
    setActingOn(req.id);
    try {
      const res  = await fetch("/api/admin/bookings/approve", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requestId: req.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to approve"); return; }
      setItems((prev) => prev.filter((r) => r.id !== req.id));
      toast.success(`Booking approved — ${req.clientName} and ${req.agentName} notified`);
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setActingOn(null);
    }
  }

  async function handleDecline() {
    if (!declineTarget) return;
    setActingOn(declineTarget.id);
    try {
      const res  = await fetch("/api/admin/bookings/decline", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requestId: declineTarget.id, reason: declineReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to decline"); return; }
      setItems((prev) => prev.filter((r) => r.id !== declineTarget.id));
      toast.success("Request declined — client notified");
      setDeclineTarget(null);
      setDeclineReason("");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setActingOn(null);
    }
  }

  return (
    <div style={{ padding: "24px 16px 80px", maxWidth: 680, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Pending Bookings
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          {items.length} client{items.length !== 1 ? "s" : ""} waiting — call each one before approving
        </p>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "var(--color-header)", margin: "0 0 4px" }}>
            All clear
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            No pending booking requests right now.
          </p>
        </div>
      )}

      {/* Request cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((req) => {
          const location = req.listingLandmark
            ? `${req.listingLandmark}, ${req.listingLga}`
            : `${req.listingLga}, ${req.listingState}`;

          return (
            <div key={req.id} style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 18, overflow: "hidden" }}>

              {/* Urgency bar — gets more orange the longer it's been waiting */}
              <div style={{ height: 3, background: "linear-gradient(90deg, var(--color-primary), #43A047)" }} />

              <div style={{ padding: 16 }}>

                {/* Time + status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Accepted {timeAgo(req.termsAcceptedAt)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#FFF8E1", color: "#92400E" }}>
                    Awaiting your call
                  </span>
                </div>

                {/* Client — the person you need to call */}
                <div style={{ background: "#E8F5E9", borderRadius: 14, padding: "14px", marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#1B5E20", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Client to call
                  </p>
                  <p style={{ margin: "0 0 6px", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, color: "#1B2E1B" }}>
                    {req.clientName}
                  </p>
                  {req.clientPhone ? (
                    <a href={`tel:${req.clientPhone}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 17, fontWeight: 700, color: "#2E7D32", textDecoration: "none" }}>
                      📞 {req.clientPhone}
                    </a>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: "#E53935", fontWeight: 600 }}>⚠ No phone number on file</p>
                  )}
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#388E3C" }}>{req.clientEmail}</p>
                </div>

                {/* Property */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                  {req.listingImages?.[0] && (
                    <img src={req.listingImages[0]} alt=""
                      style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {req.listingTitle}
                    </p>
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--color-text-muted)" }}>
                      {TYPE_LABELS[req.listingType] ?? req.listingType} · 📍 {location}
                    </p>
                    <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-primary)" }}>
                      ₦{req.listingPrice.toLocaleString()}/yr
                    </p>
                  </div>
                </div>

                {/* Agent */}
                <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--color-border)", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Agent</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{req.agentName}</p>
                  </div>
                  {req.agentPhone && (
                    <a href={`tel:${req.agentPhone}`}
                      style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
                      {req.agentPhone}
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setDeclineTarget(req)}
                    disabled={actingOn === req.id}
                    style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "#FEF2F2", border: "1px solid #FECACA", color: "#C62828", cursor: "pointer" }}>
                    Decline
                  </button>
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={actingOn === req.id}
                    style={{ flex: 2, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: actingOn === req.id ? "var(--color-border)" : "var(--color-primary)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {actingOn === req.id ? (
                      <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    ) : "✓ Approve — Connect Both Sides"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Decline backdrop */}
      {declineTarget && (
        <div onClick={() => { setDeclineTarget(null); setDeclineReason(""); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      )}

      {/* Decline sheet */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        background: "var(--color-card)", borderRadius: "22px 22px 0 0",
        transform: declineTarget ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        padding: "16px 16px 32px", maxWidth: 680, margin: "0 auto",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "0 auto 20px" }} />
        <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--color-header)", margin: "0 0 4px" }}>
          Decline request
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
          {declineTarget?.clientName} — {declineTarget?.listingTitle}
        </p>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
          Reason (shown to client)
        </label>
        <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}
          placeholder="e.g. Could not reach you on the provided number. Please re-book when available."
          rows={3}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 13, color: "var(--color-text)", background: "var(--color-bg)", resize: "none", fontFamily: "var(--font-body)", boxSizing: "border-box", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setDeclineTarget(null); setDeclineReason(""); }}
            style={{ flex: 1, padding: "13px", borderRadius: 14, fontSize: 13, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleDecline} disabled={actingOn === declineTarget?.id}
            style={{ flex: 2, padding: "13px", borderRadius: 14, fontSize: 13, fontWeight: 700, background: "#C62828", border: "none", color: "#fff", cursor: "pointer" }}>
            {actingOn === declineTarget?.id ? "Declining…" : "Confirm Decline"}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}