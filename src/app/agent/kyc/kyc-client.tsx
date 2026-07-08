// src/app/agent/kyc/kyc-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";
import { authClient } from "@/lib/auth-client";
import PhoneVerificationModal from "@/components/phone-verification-modal";

type ExistingRequest = {
  id:        string;
  status:    string;
  adminNote: string | null;
} | null;

type Props = {
  agentName:       string;
  agentPhone:      string;
  existingRequest: ExistingRequest;
};

export default function KycClient({ agentName, agentPhone, existingRequest }: Props) {
  const router     = useRouter();
  const isPending  = existingRequest?.status === "pending";
  const isDeclined = existingRequest?.status === "declined";

  const [fullName,      setFullName]      = useState(agentName);
  const [phone,         setPhone]         = useState(agentPhone);
  const [whatsapp,      setWhatsapp]      = useState("");
  const [state,         setState]         = useState("Akwa Ibom");
  const [lga,           setLga]           = useState("");
  const [loading,       setLoading]       = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const { data: session } = authClient.useSession();
  const phoneNumberVerified = (session?.user as { phoneNumberVerified?: boolean } | undefined)?.phoneNumberVerified ?? false;

  const lgaOptions = getLGAs(state);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!lga)              { toast.error("Please select your LGA");                         return; }
    if (!fullName.trim())  { toast.error("Please enter your full name");                    return; }
    if (!phone.trim())     { toast.error("Please enter your phone number");                 return; }
    if (!agreedToTerms)    { toast.error("Please read and accept the Agent Agreement");     return; }

    if (!phoneNumberVerified) {
      setShowPhoneVerify(true);
      return;
    }

    await actuallySubmit();
  }

  async function actuallySubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/kyc/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fullName, phone, whatsapp, state, lga }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Submission failed. Try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePhoneVerified() {
    setShowPhoneVerify(false);
    actuallySubmit();
  }

  // ── PENDING STATE ──────────────────────────────────────────────────────────
  if (isPending || submitted) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--color-primary)" strokeWidth="1.6" />
            <path d="M12 7v5l3 3" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 12px", lineHeight: 1.3 }}>
          Application submitted
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: 300, margin: "0 0 24px" }}>
          We'll call the number you provided to verify your identity. This usually takes less than 24 hours.
        </p>
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 16, width: "100%", maxWidth: 340, textAlign: "left", marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
            What happens next
          </p>
          {[
            "Our team will call the phone number you provided",
            "Quick identity check — one call, never repeated",
            "You'll receive a notification once approved",
            "Your verified badge will appear on all your listings",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 3 ? 10 : 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)" }}>{i + 1}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>
        <a href="/home" style={{ display: "inline-block", padding: "13px 32px", background: "var(--color-primary)", color: "#fff", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
          Back to Home
        </a>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Back</span>
          </button>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z" stroke="var(--color-primary)" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 6px" }}>
            Agent Verification
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
            Fill in your details below. Our team will call you to complete verification.
          </p>
        </div>

        {/* Declined notice */}
        {isDeclined && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: "12px 14px", marginBottom: 20 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "#C62828", margin: "0 0 4px" }}>
              Previous application declined
            </p>
            {existingRequest?.adminNote && (
              <p style={{ fontSize: 12, color: "#E57373", margin: 0 }}>Reason: {existingRequest.adminNote}</p>
            )}
            <p style={{ fontSize: 12, color: "#E57373", margin: "4px 0 0" }}>
              You can resubmit with updated information below.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Contact ── */}
          <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 16 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 14px" }}>
              Contact Details
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Full Name *</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                Phone Number * <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(we'll call this)</span>
              </label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" required
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                WhatsApp Number <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(if different)</span>
              </label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="08012345678"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* ── Location ── */}
          <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 16 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 14px" }}>
              Operating Area
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>State *</label>
                <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }} required
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 13, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }}>
                  {STATE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>LGA *</label>
                <select value={lga} onChange={(e) => setLga(e.target.value)} required
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 13, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }}>
                  <option value="">Select LGA</option>
                  {lgaOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Agent Agreement ── */}
          <div style={{ background: "var(--color-card)", border: "1.5px solid var(--color-border)", borderRadius: 16, padding: 16 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 14px" }}>
              Agent Agreement
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[
                "I will pay CorperNest ₦1,000 for every client visit confirmed through the platform",
                "Payment must be made within 24 hours of a confirmed visit",
                "Two unpaid commissions will result in my listings being hidden for 7 days, then permanently deleted",
                "The inspection fee I collect from a client covers showing them all available properties that match their needs — not just one listing. If a client does not like the first property, I will show them other available options",
                "I will not redirect CorperNest clients to personal channels to avoid the platform commission",
                "All properties I list are real, available, and accurately described",
                "My identity details are accurate and I consent to CorperNest holding them on file",
              ].map((point, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>{point}</p>
                </div>
              ))}
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: "var(--color-primary)", cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "var(--color-text)", lineHeight: 1.55, fontWeight: 500 }}>
                I have read and agree to the CorperNest Agent Agreement. I understand these terms are required to list properties on this platform.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading || !agreedToTerms}
            style={{ width: "100%", padding: "15px", background: loading || !agreedToTerms ? "var(--color-border)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading || !agreedToTerms ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Submitting…
              </>
            ) : "Submit Verification Request"}
          </button>
        </form>
      </div>

      {showPhoneVerify && (
        <PhoneVerificationModal
          onClose={() => setShowPhoneVerify(false)}
          onVerified={handlePhoneVerified}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}