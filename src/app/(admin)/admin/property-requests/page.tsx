"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import MatchSelectionSheet from "@/components/match-selection-sheet";

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
  status:     string;
  matchCount: number;
  daysLeft:   number;
}

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom",
  "2-bed":     "2 Bedroom",
  "3-bed":     "3 Bedroom",
  "room":      "Single Room",
};

export default function PropertyRequestsAdminPage() {
  const [requests, setRequests] = useState<PropertyRequestItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [matchSheetRequestId, setMatchSheetRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/property-requests/list");
      const data = await res.json();
      if (res.ok) setRequests(data.requests ?? []);
    } catch {
      toast.error("Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(requestId: string) {
    setDeletingId(requestId);
    try {
      const res = await fetch(`/api/property-requests/${requestId}/close`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Could not delete request.");
        setDeletingId(null);
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Request deleted.");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 60 }}>

      <div style={{ padding: "20px 16px 16px", backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>
            Property Requests
          </h1>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, backgroundColor: "var(--color-light)", color: "var(--color-primary)" }}>
            {requests.length} open
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>

        {loading && (
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", padding: 40 }}>Loading…</p>
        )}

        {!loading && requests.length === 0 && (
          <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 18, padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: "0 0 4px" }}>No open requests</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>New requests will show up here as renters submit them.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map((r) => {
            const urgent = r.daysLeft <= 1;
            return (
              <div key={r.id} style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>
                      {r.renterName} · {TYPE_LABELS[r.type] ?? r.type}, {r.lga}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "3px 0 0" }}>
                      {r.minBudget && r.maxBudget
                        ? `₦${r.minBudget.toLocaleString()} - ₦${r.maxBudget.toLocaleString()}/yr`
                        : "Budget not specified"}
                      {r.landmark ? ` · Near ${r.landmark}` : ""}
                    </p>
                    {r.notes && (
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "3px 0 0", fontStyle: "italic" }}>
                        &ldquo;{r.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: urgent ? "#E53935" : "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {r.daysLeft === 0 ? "Expires today" : `${r.daysLeft}d left`}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {r.matchCount}/3 matched
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      style={{ padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: deletingId === r.id ? "not-allowed" : "pointer" }}
                    >
                      {deletingId === r.id ? "…" : "Delete"}
                    </button>
                    <button
                      onClick={() => setMatchSheetRequestId(r.id)}
                      disabled={r.matchCount >= 3}
                      style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: r.matchCount >= 3 ? "var(--color-border)" : "var(--color-primary)", border: "none", color: "#fff", cursor: r.matchCount >= 3 ? "not-allowed" : "pointer", fontFamily: "var(--font-heading)" }}
                    >
                      {r.matchCount >= 3 ? "Full" : "Find Match"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match selection sheet */}
      {matchSheetRequestId && (() => {
        const activeRequest = requests.find((r) => r.id === matchSheetRequestId);
        if (!activeRequest) return null;
        return (
          <MatchSelectionSheet
            request={activeRequest}
            onClose={() => setMatchSheetRequestId(null)}
            onMatched={() => {
              setMatchSheetRequestId(null);
              fetchRequests();
            }}
          />
        );
      })()}
    </div>
  );
}