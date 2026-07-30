// src/app/admin/marketplace/availability/availability-client.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Request = {
  id:           string;
  listingId:    string;
  agreedPrice:  number;
  status:       string;
  expiresAtMs:  number;
  listingTitle: string;
  listingImage: string | null;
  sellerName:   string | null;
  sellerPhone:  string | null;
  buyerName:    string | null;
  buyerPhone:   string | null;
  createdAt:    Date | string;
};

export default function AdminAvailabilityClient({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [acting,     setActing]     = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!requests.length) return;
    const tick = setInterval(() => {
      const updated: Record<string, string> = {};
      for (const r of requests) {
        const remaining = Math.max(0, r.expiresAtMs - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        updated[r.id] = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }
      setCountdowns(updated);
    }, 1000);
    return () => clearInterval(tick);
  }, [requests]);

  async function handleAction(requestId: string, action: "confirm" | "cancel") {
    setActing(requestId);
    try {
      const res  = await fetch("/api/marketplace/availability", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, adminNote: action === "confirm" ? "Confirmed by admin on seller's behalf" : "Cancelled by admin" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed."); return; }
      toast.success(action === "confirm" ? "Availability confirmed — buyer notified." : "Reservation cancelled.");
      router.refresh();
    } catch { toast.error("Network error."); }
    finally   { setActing(null); }
  }

  const pending   = requests.filter((r) => r.status === "pending");
  const confirmed = requests.filter((r) => r.status === "confirmed");

  return (
    <div style={{ padding: "20px 16px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: "0 0 2px" }}>Availability Requests</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{requests.length} active · {pending.length} waiting for seller</p>
      </div>

      {requests.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>No pending availability requests</p>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ padding: "8px 12px", borderRadius: 10, backgroundColor: "#FFF8E1", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#92400E", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ⏳ Waiting for seller — {pending.length}
            </p>
          </div>
          {pending.map((r) => {
            const isActing    = acting === r.id;
            const minutesLeft = Math.floor((r.expiresAtMs - Date.now()) / 60000);
            const urgent      = minutesLeft <= 15;
            return (
              <div key={r.id} style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: `1.5px solid ${urgent ? "#FCA5A5" : "var(--color-border)"}`, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 12, padding: "12px 14px" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", backgroundColor: "var(--color-light)", flexShrink: 0 }}>
                    {r.listingImage
                      ? <img src={r.listingImage} alt={r.listingTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.listingTitle}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 4px", fontFamily: "var(--font-heading)" }}>
                      ₦{r.agreedPrice.toLocaleString("en-NG")}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>Buyer:</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)" }}>{r.buyerName ?? "—"}</span>
                        {r.buyerPhone && <a href={`tel:${r.buyerPhone}`} style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none" }}>📞 {r.buyerPhone}</a>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>Seller:</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)" }}>{r.sellerName ?? "—"}</span>
                        {r.sellerPhone && <a href={`tel:${r.sellerPhone}`} style={{ fontSize: 11, fontWeight: 700, color: urgent ? "#C62828" : "var(--color-primary)", textDecoration: "none" }}>📞 {r.sellerPhone}</a>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 800, color: urgent ? "#C62828" : "#92400E" }}>
                      {countdowns[r.id] ?? "45:00"}
                    </span>
                    {urgent && <span style={{ fontSize: 9, fontWeight: 700, color: "#C62828" }}>CALL NOW</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, padding: "0 14px 12px" }}>
                  <button onClick={() => handleAction(r.id, "confirm")} disabled={isActing}
                    style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", backgroundColor: "#15803D", color: "#fff", fontSize: 13, fontWeight: 700, cursor: isActing ? "not-allowed" : "pointer", opacity: isActing ? 0.7 : 1 }}>
                    {isActing ? "…" : "✅ Confirm available"}
                  </button>
                  <button onClick={() => handleAction(r.id, "cancel")} disabled={isActing}
                    style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmed.length > 0 && (
        <div>
          <div style={{ padding: "8px 12px", borderRadius: 10, backgroundColor: "#E8F5E9", marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#2E7D32", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ✅ Confirmed — buyer paying · {confirmed.length}
            </p>
          </div>
          {confirmed.map((r) => (
            <div key={r.id} style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid #A5D6A7", padding: "12px 14px", marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>{r.listingTitle}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 4px", fontFamily: "var(--font-heading)" }}>₦{r.agreedPrice.toLocaleString("en-NG")}</p>
              <p style={{ fontSize: 11, color: "#15803D", margin: 0 }}>Buyer has {countdowns[r.id] ?? "--:--"} to complete payment</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}