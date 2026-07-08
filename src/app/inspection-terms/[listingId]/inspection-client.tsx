// src/app/inspection-terms/[listingId]/terms-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ListingInfo = {
  id:        string;
  title:     string;
  type:      string;
  lga:       string;
  state:     string;
  landmark:  string | null;
  price:     number;
  agentName: string;
};

const TYPE_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "1-bed":     "1 Bedroom",
  "2-bed":     "2 Bedroom",
  "3-bed":     "3 Bedroom",
  "room":      "Single Room",
};

export default function InspectionTermsClient({
  listing,
  clientName,
}: {
  listing:    ListingInfo;
  clientName: string;
}) {
  const router      = useRouter();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const location = listing.landmark
    ? `${listing.landmark}, ${listing.lga}, ${listing.state}`
    : `${listing.lga}, ${listing.state}`;

  async function handleAccept() {
    setLoading(true);
    try {
      const res  = await fetch("/api/bookings/request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not submit request. Try again.");
        setLoading(false);
        return;
      }

      setAccepted(true);
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (accepted) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="var(--color-primary)" strokeWidth="1.8" fill="none" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 12px" }}>
          Request received!
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.7, maxWidth: 320, margin: "0 0 8px" }}>
          Our team will call you shortly on your verified number to explain the next steps and confirm your visit.
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6, maxWidth: 300, margin: "0 0 32px" }}>
          Once we confirm, you'll see the agent's contact details in your bookings and they'll be expecting your visit.
        </p>
        <button onClick={() => router.push("/bookings")}
          style={{ padding: "14px 32px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Go to My Bookings
        </button>
      </div>
    );
  }

  // ── T&Cs page ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", paddingBottom: 120 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", background: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>
            Before You Book
          </p>
        </div>
        {/* Scroll hint — draws attention downward immediately */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "var(--color-light)", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-primary)" }}>Read & accept below</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: "bounce 1.5s infinite" }}>
            <path d="M12 5v14M5 12l7 7 7-7" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>

        {/* Property summary */}
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            You're requesting to inspect
          </p>
          <p style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--color-header)" }}>
            {listing.title}
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-muted)" }}>
            {TYPE_LABELS[listing.type] ?? listing.type} · 📍 {location}
          </p>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "var(--color-primary)" }}>
            ₦{listing.price.toLocaleString()}/yr
          </p>
        </div>

        {/* Terms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, color: "var(--color-header)" }}>
            How this works
          </p>

          {[
            {
              icon: "🆓",
              title: "Booking through CorperNest is free",
              body: "You pay nothing to CorperNest to book this inspection. Our platform connects you with verified agents at no charge.",
            },
            {
              icon: "💰",
              title: "You will pay the agent directly when you meet",
              body: "When you arrive to view the property, the agent will charge you an inspection fee directly — cash or transfer. This fee goes entirely to the agent, not to CorperNest.",
            },
            {
              icon: "🏠",
              title: "The inspection fee covers all properties shown",
              body: "If you visit and do not like the first property, the agent is expected to show you other available options — you do not need to pay again for the same visit.",
            },
            {
              icon: "📞",
              title: "We will call you first",
              body: "Our team will call you on your verified number to confirm your visit before connecting you to the agent. Please pick up when we call.",
            },
            {
              icon: "✅",
              title: "Tap 'I Have Seen The Agent' after your visit",
              body: "After meeting the agent, tap the confirmation button in your bookings. This creates an official record of your inspection.",
            },
            {
              icon: "🛡️",
              title: "This agent has been verified by CorperNest",
              body: "Every agent on our platform has passed our identity verification. Their details are on file with us. If anything goes wrong, contact us immediately.",
            },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
                {item.icon}
              </div>
              <div>
                <p style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)" }}>
                  {item.title}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Acceptance note */}
        <div style={{ background: "var(--color-light)", border: "1px solid var(--color-border)", borderRadius: 14, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            By tapping <strong>Accept & Request Inspection</strong>, {clientName.split(" ")[0]}, you confirm you have read and understood how CorperNest inspections work, and you agree to pay the agent their inspection fee directly when you meet.
          </p>
        </div>

      </div>

      {/* ── STICKY ACCEPT BUTTON — always visible at bottom ── */}
      {/* User sees this immediately on landing, no scrolling needed to find the action */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
        padding: "12px 16px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={handleAccept} disabled={loading}
            style={{ width: "100%", padding: "16px", background: loading ? "var(--color-border)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Submitting…
              </>
            ) : (
              <>
                Accept & Request Inspection
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
          <button onClick={() => router.back()}
            style={{ width: "100%", padding: "12px", background: "none", color: "var(--color-text-muted)", border: "none", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
      `}</style>
    </div>
  );
}