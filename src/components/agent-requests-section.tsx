"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import MatchSelectionSheet from "@/components/match-selection-sheet";

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom",
  "2-bed":     "2 Bedroom",
  "3-bed":     "3 Bedroom",
  "room":      "Single Room",
};

interface PropertyRequestItem {
  id:         string;
  renterName: string;
  lga:        string;
  state:      string;
  type:       string;
  landmark:   string | null;
  minBudget:  number | null;
  maxBudget:  number | null;
  notes:      string | null;
  matchCount: number;
  daysLeft:   number;
}

// ─── COLLAPSED CHAT-LIST ROW ───────────────────────────────────────────────

function RequestRow({
  request, isOpen, onToggle, onMatchClick,
}: {
  request: PropertyRequestItem;
  isOpen: boolean;
  onToggle: () => void;
  onMatchClick: () => void;
}) {
  const initial = request.renterName?.charAt(0).toUpperCase() ?? "?";
  const isFull  = request.matchCount >= 3;
  const urgent  = request.daysLeft <= 1;

  return (
    <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>

      {/* Collapsed row — chat-list style */}
      <button
        onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: "var(--color-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15,
          color: "var(--color-primary)", flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)" }}>
            {request.renterName}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {TYPE_LABELS[request.type] ?? request.type} · {request.lga}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: urgent ? "#E53935" : "var(--color-text-muted)" }}>
            {request.daysLeft === 0 ? "Today" : `${request.daysLeft}d`}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: isFull ? "#F3F4F6" : "var(--color-light)", color: isFull ? "var(--color-text-muted)" : "var(--color-primary)" }}>
            {request.matchCount}/3
          </span>
        </div>
      </button>

      {/* Expanded full details */}
      {isOpen && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            <Detail label="Budget" value={request.minBudget && request.maxBudget ? `₦${request.minBudget.toLocaleString()} - ₦${request.maxBudget.toLocaleString()}/yr` : "Not specified"} />
            {request.landmark && <Detail label="Landmark" value={request.landmark} />}
            {request.notes && <Detail label="Notes" value={request.notes} />}
          </div>

          <button
            onClick={onMatchClick}
            disabled={isFull}
            style={{
              width: "100%", padding: "11px", borderRadius: 12, fontSize: 13, fontWeight: 700,
              background: isFull ? "var(--color-border)" : "var(--color-primary)",
              color: "#fff", border: "none", cursor: isFull ? "not-allowed" : "pointer",
              fontFamily: "var(--font-heading)",
            }}
          >
            {isFull ? "Match limit reached" : "I have this — Find Match"}
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--color-text-muted)", minWidth: 60, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--color-text)" }}>{value}</span>
    </div>
  );
}

// ─── MAIN SECTION — drop into agent dashboard as a new tab ─────────────────

export default function AgentRequestsSection() {
  const [requests, setRequests] = useState<PropertyRequestItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [openId, setOpenId]     = useState<string | null>(null);
  const [matchSheetId, setMatchSheetId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res  = await fetch("/api/property-requests/list");
      const data = await res.json();
      if (res.ok) setRequests(data.requests ?? []);
    } catch {
      toast.error("Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  const activeRequest = requests.find((r) => r.id === matchSheetId);

  return (
    <div>
      {/* Counter header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-heading)" }}>
          Open Requests
        </p>
        {requests.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--color-light)", color: "var(--color-primary)" }}>
            {requests.length}
          </span>
        )}
      </div>

      {loading && (
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", padding: 24 }}>Loading…</p>
      )}

      {!loading && requests.length === 0 && (
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 18, padding: "32px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No open requests right now.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {requests.map((r) => (
          <RequestRow
            key={r.id}
            request={r}
            isOpen={openId === r.id}
            onToggle={() => setOpenId(openId === r.id ? null : r.id)}
            onMatchClick={() => setMatchSheetId(r.id)}
          />
        ))}
      </div>

      {activeRequest && (
        <MatchSelectionSheet
          request={activeRequest}
          onClose={() => setMatchSheetId(null)}
          onMatched={() => {
            setMatchSheetId(null);
            setOpenId(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}