// src/app/(market)/marketplace/[id]/checkout/page.tsx
// Checkout page — shown after seller confirms availability.
// Verifies the confirmation is still valid before showing payment button.
// Server component fetches and validates; client handles Paystack redirect.
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function Spinner({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}30`, borderTopColor: color, animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
  );
}

export default function MarketplaceCheckoutPage() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const listingId    = params.id as string;
  const availabilityRequestId = searchParams.get("availability");

  const [loading,    setLoading]    = useState(true);
  const [paying,     setPaying]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [details,    setDetails]    = useState<{
    listingTitle: string;
    agreedPrice:  number;
    commission:   number;
    sellerPayout: number;
    expiresAtMs:  number;
  } | null>(null);
  const [countdown,  setCountdown]  = useState("60:00");

  // Live countdown timer
  useEffect(() => {
    if (!details?.expiresAtMs) return;
    const tick = setInterval(() => {
      const remaining = Math.max(0, details.expiresAtMs - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      // When expired — show error
      if (remaining === 0) {
        clearInterval(tick);
        setError("Your checkout window expired. The item is available again — you can try reserving it.");
        setDetails(null);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [details?.expiresAtMs]);

  // Verify the availability request on mount
  useEffect(() => {
    if (!availabilityRequestId) {
      setError("No availability confirmation found. Please start the purchase process again.");
      setLoading(false);
      return;
    }

    fetch(`/api/marketplace/availability?requestId=${availabilityRequestId}`)
      .then((r) => r.json())
      .then((data) => {
        const req = data.request;
        if (!req) {
          setError("Availability request not found.");
          return;
        }
        if (req.status === "expired") {
          setError("Your checkout window expired. The item is available again — you can try reserving it.");
          return;
        }
        if (req.status !== "confirmed") {
          setError("This item has not been confirmed as available yet.");
          return;
        }

        // Fetch listing title for display
        fetch(`/api/marketplace/listings/${listingId}`)
          .then((r) => r.json())
          .then((d) => {
            const price      = req.agreedPrice;
            const commission = Math.round(price * 0.05);
            setDetails({
              listingTitle: d.title ?? "Item",
              agreedPrice:  price,
              commission,
              sellerPayout: price - commission,
              expiresAtMs:  req.checkoutExpiresAtMs ?? (Date.now() + 60 * 60 * 1000),
            });
          })
          .catch(() => {
            setDetails({
              listingTitle: "Item",
              agreedPrice:  req.agreedPrice,
              commission:   Math.round(req.agreedPrice * 0.05),
              sellerPayout: Math.round(req.agreedPrice * 0.95),
              expiresAtMs:  req.checkoutExpiresAtMs ?? (Date.now() + 60 * 60 * 1000),
            });
          });
      })
      .catch(() => setError("Could not verify availability. Try again."))
      .finally(() => setLoading(false));
  }, []);

  async function handlePay() {
    if (!availabilityRequestId) return;
    setPaying(true);
    try {
      const res  = await fetch("/api/marketplace/checkout/init", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityRequestId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not initialize payment. Try again."); return; }
      // Redirect to Paystack payment page
      window.location.href = data.authorizationUrl;
    } catch { toast.error("Network error. Try again."); }
    finally   { setPaying(false); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={32} color="var(--color-primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", textAlign: "center", margin: 0 }}>Cannot proceed to payment</p>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", textAlign: "center", margin: 0, lineHeight: 1.6 }}>{error}</p>
        <button onClick={() => router.push(`/marketplace/${listingId}`)}
          style={{ padding: "13px 24px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Back to listing
        </button>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 56, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>Complete Payment</p>
          <p style={{ fontSize: 11, color: "#F59E0B", margin: 0, fontWeight: 600 }}>
            ⏱ {countdown} remaining to complete payment
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Escrow explanation */}
        <div style={{ padding: "14px", borderRadius: 14, backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#15803D", margin: "0 0 6px" }}>🔒 Your money is protected</p>
          <p style={{ fontSize: 12, color: "#15803D", margin: 0, lineHeight: 1.6 }}>
            Your payment is held by CorperNest until you confirm you have received the item in good condition. The seller only gets paid after you approve.
          </p>
        </div>

        {/* Price breakdown */}
        <div style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "10px 14px", margin: 0, borderBottom: "1px solid var(--color-border)" }}>
            Order summary
          </p>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Item</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", textAlign: "right", maxWidth: "60%" }}>{details.listingTitle}</span>
          </div>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Item price</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>₦{details.agreedPrice.toLocaleString("en-NG")}</span>
          </div>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>CorperNest escrow fee (5%)</span>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>₦{details.commission.toLocaleString("en-NG")}</span>
          </div>
          <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", backgroundColor: "var(--color-light)" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>You pay</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>₦{details.agreedPrice.toLocaleString("en-NG")}</span>
          </div>
        </div>

        {/* What happens next */}
        <div style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", padding: "14px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>What happens next</p>
          {[
            { icon: "💳", text: "You pay via Paystack — card, bank transfer, or USSD" },
            { icon: "📦", text: "Seller's contact details are revealed — coordinate pickup" },
            { icon: "✅", text: "Tap \"Item Received\" in Purchases when you collect the item" },
            { icon: "💰", text: "Seller receives payment within 24 hours of your confirmation" },
          ].map(({ icon, text }, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 3 ? 10 : 0 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Pay button */}
        <button onClick={handlePay} disabled={paying}
          style={{ padding: "16px", borderRadius: 14, border: "none", backgroundColor: paying ? "var(--color-border)" : "#15803D", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {paying ? <><Spinner /> Processing…</> : `🔒 Pay ₦${details.agreedPrice.toLocaleString("en-NG")} via Paystack`}
        </button>

        <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          Payments are processed securely by Paystack. CorperNest holds your money in escrow until you confirm receipt. Disputes must be raised within 48 hours.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}