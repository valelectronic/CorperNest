"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

type Props = {
  onClose: () => void;
  onVerified: () => void;
};

export default function PhoneVerificationModal({ onClose, onVerified }: Props) {
  const [step, setStep]   = useState<"input" | "code">("input");
  const [phone, setPhone] = useState("");
  const [code, setCode]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();

    if (!/^0\d{10}$/.test(trimmed)) {
      setError("Enter a valid Nigerian phone number (e.g. 08012345678)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber: trimmed });

      if (sendError) {
        setError(sendError.message ?? "Could not send code. Try again.");
        setLoading(false);
        return;
      }

      setStep("code");
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // disableSession: true — user already has a session, we don't want
      // this to create or touch a separate one.
      // updatePhoneNumber: true — this is what actually saves the verified
      // number onto the account and flips phoneNumberVerified to true.
      const { error: verifyError } = await authClient.phoneNumber.verify({
        phoneNumber: phone.trim(),
        code: code.trim(),
        disableSession: true,
        updatePhoneNumber: true,
      });

      if (verifyError) {
        setError(verifyError.message ?? "Invalid or expired code. Try again.");
        setLoading(false);
        return;
      }

      toast.success("Phone number verified!");
      onVerified();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    try {
      await authClient.phoneNumber.sendOtp({ phoneNumber: phone.trim() });
      toast.success("Code resent.");
    } catch {
      setError("Could not resend code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", background: "var(--color-card)", borderRadius: "22px 22px 0 0", padding: "8px 20px 32px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "8px auto 20px" }} />

        <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="var(--color-primary)" strokeWidth="1.8" fill="none" />
          </svg>
        </div>

        {step === "input" ? (
          <>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 6px" }}>
              Verify your phone number
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
              We need to confirm your number is real and reachable before continuing.
            </p>

            <form onSubmit={handleSendCode}>
              <input
                type="tel" inputMode="numeric" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="08012345678" required
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box", marginBottom: 16 }}
              />

              {error && <p style={{ fontSize: 13, color: "#E53935", margin: "0 0 16px" }}>{error}</p>}

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "15px", background: loading ? "var(--color-border)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Sending…" : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 6px" }}>
              Enter the code
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
              We sent a 6-digit code to <strong>{phone}</strong>
            </p>

            <form onSubmit={handleVerify}>
              <input
                type="text" inputMode="numeric" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000" required
                style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 18, textAlign: "center", letterSpacing: 4, fontFamily: "var(--font-mono)", color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box", marginBottom: 16 }}
              />

              {error && <p style={{ fontSize: 13, color: "#E53935", margin: "0 0 16px" }}>{error}</p>}

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "15px", background: loading ? "var(--color-border)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", marginBottom: 10 }}>
                {loading ? "Verifying…" : "Verify"}
              </button>
            </form>

            <button onClick={handleResend} disabled={loading}
              style={{ width: "100%", fontSize: 13, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Resend code
            </button>
          </>
        )}

        <button onClick={onClose}
          style={{ width: "100%", padding: "13px", background: "var(--color-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 10 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}