// src/app/agent/kyc/kyc-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";

// Nigerian banks list
const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank",
  "First City Monument Bank (FCMB)", "Guaranty Trust Bank (GTBank)",
  "Heritage Bank", "Keystone Bank", "Polaris Bank", "Providus Bank",
  "Stanbic IBTC Bank", "Standard Chartered Bank", "Sterling Bank",
  "Suntrust Bank", "Union Bank", "United Bank for Africa (UBA)",
  "Unity Bank", "Wema Bank", "Zenith Bank", "Kuda Bank", "Opay",
  "Palmpay", "Moniepoint", "Carbon", "VFD Microfinance Bank",
];

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
  const router  = useRouter();
  const isPending  = existingRequest?.status === "pending";
  const isDeclined = existingRequest?.status === "declined";

  // Form state
  const [fullName,      setFullName]      = useState(agentName);
  const [phone,         setPhone]         = useState(agentPhone);
  const [whatsapp,      setWhatsapp]      = useState("");
  const [state,         setState]         = useState("Akwa Ibom");
  const [lga,           setLga]           = useState("");
  const [bankName,      setBankName]      = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName,   setAccountName]   = useState("");
  const [loading,       setLoading]       = useState(false);
  const [submitted,     setSubmitted]     = useState(false);

  const lgaOptions = getLGAs(state);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!lga) { toast.error("Please select your LGA"); return; }
    if (!bankName) { toast.error("Please select your bank"); return; }
    if (!/^\d{10}$/.test(accountNumber.trim())) {
      toast.error("Account number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agent/kyc/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fullName, phone, whatsapp, state, lga,
          bankName, accountNumber, accountName,
        }),
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

  // ── PENDING STATE ─────────────────────────────────────────────────────────
  if (isPending || submitted) {
    return (
      <div style={{
        minHeight: "100dvh", background: "var(--color-bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 16px", textAlign: "center",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "var(--color-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24,
        }}>
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

        <div style={{
          background: "var(--color-card)", border: "1px solid var(--color-border)",
          borderRadius: 16, padding: 16, width: "100%", maxWidth: 340,
          textAlign: "left", marginBottom: 24,
        }}>
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
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: "var(--color-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)" }}>{i + 1}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>

        <a href="/home" style={{
          display: "inline-block", padding: "13px 32px",
          background: "var(--color-primary)", color: "#fff", borderRadius: 14,
          fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, textDecoration: "none",
        }}>
          Back to Home
        </a>
      </div>
    );
  }

  // ── DECLINED STATE ────────────────────────────────────────────────────────
  // Show declined notice at top but still allow resubmission

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Back</span>
          </button>

          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "var(--color-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 14,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z"
                stroke="var(--color-primary)" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
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
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: 14, padding: "12px 14px", marginBottom: 20,
          }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "#C62828", margin: "0 0 4px" }}>
              Previous application declined
            </p>
            {existingRequest?.adminNote && (
              <p style={{ fontSize: 12, color: "#E57373", margin: 0 }}>
                Reason: {existingRequest.adminNote}
              </p>
            )}
            <p style={{ fontSize: 12, color: "#E57373", margin: "4px 0 0" }}>
              You can resubmit with updated information below.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── SECTION: Contact ── */}
          <div style={{
            background: "var(--color-card)", border: "1px solid var(--color-border)",
            borderRadius: 16, padding: 16,
          }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 14px" }}>
              Contact Details
            </p>

            {/* Full name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid var(--color-border)", fontSize: 14,
                  color: "var(--color-text)", background: "var(--color-bg)",
                  boxSizing: "border-box", fontFamily: "var(--font-body)",
                }}
              />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                Phone Number * <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(we'll call this)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08012345678"
                required
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid var(--color-border)", fontSize: 14,
                  color: "var(--color-text)", background: "var(--color-bg)",
                  boxSizing: "border-box", fontFamily: "var(--font-body)",
                }}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                WhatsApp Number <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(if different)</span>
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="08012345678"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid var(--color-border)", fontSize: 14,
                  color: "var(--color-text)", background: "var(--color-bg)",
                  boxSizing: "border-box", fontFamily: "var(--font-body)",
                }}
              />
            </div>
          </div>

          {/* ── SECTION: Location ── */}
          <div style={{
            background: "var(--color-card)", border: "1px solid var(--color-border)",
            borderRadius: 16, padding: 16,
          }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 14px" }}>
              Operating Area
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                  State *
                </label>
                <select
                  value={state}
                  onChange={(e) => { setState(e.target.value); setLga(""); }}
                  required
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: "1.5px solid var(--color-border)", fontSize: 13,
                    color: "var(--color-text)", background: "var(--color-bg)",
                    boxSizing: "border-box",
                  }}
                >
                  {STATE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                  LGA *
                </label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: "1.5px solid var(--color-border)", fontSize: 13,
                    color: "var(--color-text)", background: "var(--color-bg)",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select LGA</option>
                  {lgaOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── SECTION: Bank Details ── */}
          <div style={{
            background: "var(--color-card)", border: "1px solid var(--color-border)",
            borderRadius: 16, padding: 16,
          }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>
              Bank Details
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 14px" }}>
              For receiving your 80% payout after successful inspections.
            </p>

            {/* Bank name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                Bank Name *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid var(--color-border)", fontSize: 13,
                  color: "var(--color-text)", background: "var(--color-bg)",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select bank</option>
                {NIGERIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Account number */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                Account Number * <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(10 digits)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="0123456789"
                required
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid var(--color-border)", fontSize: 14,
                  color: "var(--color-text)", background: "var(--color-bg)",
                  boxSizing: "border-box", fontFamily: "var(--font-mono)", letterSpacing: "1px",
                }}
              />
            </div>

            {/* Account name */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                Account Name * <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(as it appears on your bank)</span>
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="John Doe"
                required
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid var(--color-border)", fontSize: 14,
                  color: "var(--color-text)", background: "var(--color-bg)",
                  boxSizing: "border-box", fontFamily: "var(--font-body)",
                }}
              />
            </div>
          </div>

          {/* Privacy note */}
          <div style={{
            background: "var(--color-light)", border: "1px solid var(--color-border)",
            borderRadius: 12, padding: "10px 14px",
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" stroke="var(--color-primary)" strokeWidth="1.6" />
              <path d="M12 8v4M12 16h.01" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Your bank details are stored securely and only used for processing your inspection fee payouts. They are never shared with clients.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "15px",
              background: loading ? "var(--color-border)" : "var(--color-primary)",
              color: "#fff", border: "none", borderRadius: 14,
              fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }} />
                Submitting…
              </>
            ) : (
              "Submit Verification Request"
            )}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}