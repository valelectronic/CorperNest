// src/app/(market)/marketplace/[id]/confirm-availability/page.tsx
// Seller lands here after tapping the push notification.
// Shows item details and two buttons: confirm available or deny.
// Works for admin too — admin can confirm on seller's behalf after 30 minutes.
"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

function Spinner({ color = "#fff" }: { color?: string }) {
  return <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${color}30`, borderTopColor: color, animation: "spin 0.8s linear infinite", display: "inline-block" }} />;
}

export default function ConfirmAvailabilityPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const listingId    = params.id as string;
  const requestId    = searchParams.get("request");

  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState<"confirm" | "deny" | "cancel" | null>(null);
  const [done,        setDone]        = useState<"confirmed" | "denied" | null>(null);
  const [details,     setDetails]     = useState<{
    listingTitle: string;
    listingImage: string | null;
    price:        number;
    status:       string;
    minutesLeft:  number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) { setError("No availability request found."); setLoading(false); return; }

    // Fetch listing details + request by requestId directly (not by listingId+buyerId)
    Promise.all([
      fetch(`/api/marketplace/listings/${listingId}`).then((r) => r.json()),
      fetch(`/api/marketplace/availability?requestId=${requestId}`).then((r) => r.json()),
    ])
      .then(([listingData, availData]) => {
        const req = availData.request;
        if (!req) { setError("This availability request has already been handled or expired."); return; }
        if (req.status === "confirmed") { setDone("confirmed"); return; }
        if (req.status === "denied")    { setDone("denied"); return; }
        if (req.status === "cancelled") { setDone("denied"); return; }
        if (req.status === "expired")   { setError("This request expired — the buyer has been notified."); return; }

        setDetails({
          listingTitle: listingData.title ?? "Your item",
          listingImage: listingData.images?.[0] ?? null,
          price:        listingData.price ?? 0,
          status:       req.status,
          minutesLeft:  req.minutesRemaining ?? 45,
        });
      })
      .catch(() => setError("Could not load request details. Try again."))
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(action: "confirm" | "deny" | "cancel") {
    if (!requestId) return;
    setSubmitting(action);
    try {
      const res  = await fetch("/api/marketplace/availability", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not process. Try again."); return; }
      if (action === "cancel") {
        toast.success("Reservation cancelled — listing is active again.");
        router.push("/marketplace/my-listings");
      } else {
        setDone(action === "confirm" ? "confirmed" : "denied");
      }
    } catch { toast.error("Network error. Try again."); }
    finally   { setSubmitting(null); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner color="var(--color-primary)" />
      </div>
    );
  }

  // Already handled
  if (done === "confirmed") {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", padding: "48px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 56 }}>✅</div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "#15803D", margin: 0, textAlign: "center" }}>Availability confirmed</h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
          The buyer has been notified and has 1 hour to complete payment. Prepare the item for pickup.
        </p>
        <button onClick={() => router.push("/marketplace/my-listings")}
          style={{ padding: "13px 24px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          View My Listings
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (done === "denied") {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", padding: "48px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 56 }}>📭</div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: 0, textAlign: "center" }}>Item marked as unavailable</h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
          The buyer has been notified. Your listing has been hidden — contact CorperNest admin if this was a mistake.
        </p>
        <button onClick={() => router.push("/marketplace/my-listings")}
          style={{ padding: "13px 24px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          View My Listings
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", padding: "48px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 56 }}>⚠️</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", textAlign: "center", margin: 0 }}>{error ?? "Something went wrong"}</p>
        <button onClick={() => router.push("/marketplace/my-listings")}
          style={{ padding: "12px 24px", borderRadius: 12, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          My Listings
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "14px 16px", backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>
          Availability Request
        </p>
        <p style={{ fontSize: 11, color: "#F59E0B", margin: "2px 0 0", fontWeight: 600 }}>
          ⏱ {details.minutesLeft} minutes remaining to respond
        </p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Item card */}
        <div style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          {details.listingImage && (
            <div style={{ width: "100%", height: 180, overflow: "hidden" }}>
              <img src={details.listingImage} alt={details.listingTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ padding: "14px" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>{details.listingTitle}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--color-primary)", margin: 0, fontFamily: "var(--font-heading)" }}>
              ₦{details.price.toLocaleString("en-NG")}
            </p>
          </div>
        </div>

        {/* What is happening */}
        <div style={{ padding: "14px", borderRadius: 14, backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#4338CA", margin: "0 0 6px" }}>
            🛍️ A buyer wants to purchase this item
          </p>
          <p style={{ fontSize: 12, color: "#4338CA", margin: 0, lineHeight: 1.6 }}>
            They are waiting to complete their order. Confirm the item is still with you so they can proceed. If you confirm, you have nothing to do until they pay — then coordinate pickup.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => handleAction("confirm")} disabled={!!submitting}
            style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", backgroundColor: submitting ? "var(--color-border)" : "#15803D", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {submitting === "confirm" ? <Spinner /> : "✅ Yes, item is still available"}
          </button>

          <button onClick={() => handleAction("deny")} disabled={!!submitting}
            style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1.5px solid #FCA5A5", backgroundColor: "#FEF2F2", color: "#C62828", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {submitting === "deny" ? <Spinner color="#C62828" /> : "❌ No, item is no longer available"}
          </button>

          <button onClick={() => handleAction("cancel")} disabled={!!submitting}
            style={{ width: "100%", padding: "12px", borderRadius: 14, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {submitting === "cancel" ? <Spinner color="var(--color-text-muted)" /> : "↩ Cancel this reservation"}
          </button>
        </div>

        <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          If you do not respond within {details.minutesLeft} minutes, CorperNest will attempt to contact you directly. Repeated non-responses may result in your listing being removed.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}