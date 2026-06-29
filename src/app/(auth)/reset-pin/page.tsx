"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ResetPinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const channel = searchParams.get("channel") ?? "email"; // "sms" or "email"
  const email   = searchParams.get("email") ?? "";
  const phone   = searchParams.get("phone") ?? "";

  const [code, setCode] = useState("");
  const [pin, setPin]   = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();

    if (code.trim().length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    if (pin.length < 4) {
      setError("Enter a 4-digit PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: resetError } =
        channel === "sms"
          ? await authClient.phoneNumber.resetPassword({
              phoneNumber: phone,
              otp: code.trim(),
              newPassword: pin,
            })
          : await authClient.emailOtp.resetPassword({
              email,
              otp: code.trim(),
              password: pin,
            });

      if (resetError) {
        setError(resetError.message ?? "Invalid or expired code. Please try again.");
        setLoading(false);
        return;
      }

      // Reset succeeded — sign in fresh with the new PIN, regardless of
      // whether resetPassword created a session on its own.
      router.push("/signin?reset=success");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");

    try {
      if (channel === "sms") {
        await authClient.phoneNumber.requestPasswordReset({ phoneNumber: phone });
      } else {
        await authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" });
      }
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="mb-6">
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            CorperNest
          </span>
        </div>

        <h1
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
        >
          Reset your PIN
        </h1>

        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          Enter the code sent to{" "}
          <span className="break-all" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            {channel === "sms" ? "your phone" : email}
          </span>
          , then choose your new PIN.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              6-digit code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              className="w-full rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest focus:outline-none"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              New PIN
            </label>
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              required
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none tracking-widest"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
                fontFamily: "var(--font-mono)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPin((s) => !s)}
              className="text-xs font-medium mt-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              {showPin ? "Hide PIN" : "Show PIN"}
            </button>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#E53935" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6 || pin.length < 4}
            className="w-full font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              backgroundColor: "var(--color-action)",
              color: "#FFFFFF",
              fontFamily: "var(--font-heading)",
            }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset PIN"
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-4" style={{ color: "var(--color-text-muted)" }}>
          <button
            onClick={handleResend}
            disabled={resending}
            className="font-medium"
            style={{ color: "var(--color-primary)" }}
          >
            {resending ? "Resending..." : "Resend code"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function ResetPinPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg)" }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <ResetPinForm />
    </Suspense>
  );
}