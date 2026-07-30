// src/app/(market)/marketplace/[id]/checkout/success/page.tsx
// Paystack redirects here after payment completes.
// Webhook has already processed the payment by the time user lands here.
// Just verify the payment and show the success screen.
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const ref          = searchParams.get("ref");
  const listingId    = params.id as string;

  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!ref) { setChecking(false); return; }
    // Verify payment via Paystack
    fetch(`/api/marketplace/checkout/verify?reference=${ref}`)
      .then((r) => r.json())
      .then((d) => { if (d.paid) setVerified(true); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <span style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Confirming your payment…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", padding: "48px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ fontSize: 64 }}>{verified ? "✅" : "⚠️"}</div>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: verified ? "#15803D" : "var(--color-header)", margin: 0, textAlign: "center" }}>
        {verified ? "Payment confirmed!" : "Payment status unclear"}
      </h1>

      <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0, textAlign: "center", lineHeight: 1.7 }}>
        {verified
          ? "Your payment is held safely in escrow. The seller's contact has been sent to you. Coordinate pickup and tap \"Item Received\" when you collect the item."
          : "We couldn't confirm your payment status right now. If money left your account, it's safe — check your Purchases page or contact support."}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        <button onClick={() => router.push("/marketplace/purchases")}
          style={{ padding: "14px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Track in Purchases
        </button>
        <button onClick={() => router.push("/marketplace")}
          style={{ padding: "13px", borderRadius: 14, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Back to Marketplace
        </button>
      </div>
    </div>
  );
}