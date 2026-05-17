"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState("");

  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const hasAttempted = useRef(false);

  // Read localStorage safely on client
  useEffect(() => {
    setEmail(localStorage.getItem("pending_email") ?? "");
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = useCallback(async (code: string) => {
    if (code.length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    if (type === "signup") {
      const name = localStorage.getItem("pending_name") ?? "";

      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });

      if (error) {
        setError(error.message ?? "Invalid or expired code.");
        setLoading(false);
        return;
      }

      await authClient.updateUser({ name });
      localStorage.removeItem("pending_email");
      localStorage.removeItem("pending_name");
      router.push("/role");
      return;
    }

    if (type === "signin") {
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp: code,
      });

      if (error) {
        setError(error.message ?? "Invalid or expired code.");
        setLoading(false);
        return;
      }

      localStorage.removeItem("pending_email");
      router.push("/home");
      return;
    }
  }, [email, type, router]);

  // Auto-verify when all 6 digits are filled — fires once per attempt
  useEffect(() => {
    const code = otp.join("");
    if (code.length === 6 && !loading && !hasAttempted.current) {
      hasAttempted.current = true;
      handleVerify(code);
    }
  }, [otp, loading, handleVerify]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    hasAttempted.current = false; // reset so user can retry after wrong code
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      hasAttempted.current = false;
      setOtp(pasted.split(""));
      inputs.current[5]?.focus();
    }
  }

  async function handleResend() {
    hasAttempted.current = false; // reset for fresh attempt
    setResending(true);
    setError("");
    setOtp(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();

    const otpType = type === "signup" ? "email-verification" : "sign-in";

    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: otpType,
    });

    setCountdown(60);
    setCanResend(false);
    setResending(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Logo */}
        <div className="mb-8">
          <span
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
            }}
          >
            CorperNest
          </span>
        </div>

        <h1
          className="text-2xl font-bold mb-1"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-text)",
          }}
        >
          Enter your code
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
          We sent a 6-digit code to{" "}
          <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            {email || "your email"}
          </span>
        </p>

        {/* OTP Boxes */}
        <div className="flex gap-3 justify-between mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl focus:outline-none disabled:opacity-50 transition-opacity"
              style={{
                border: digit
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
                fontFamily: "var(--font-mono)",
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm mb-4" style={{ color: "#E53935" }}>
            {error}
          </p>
        )}

        {/* Verify Button — manual fallback */}
        <button
          onClick={() => {
            hasAttempted.current = false;
            handleVerify(otp.join(""));
          }}
          disabled={loading || otp.join("").length < 6}
          className="w-full font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50 mb-4 flex items-center justify-center gap-2"
          style={{
            backgroundColor: "var(--color-action)",
            color: "#FFFFFF",
            fontFamily: "var(--font-heading)",
          }}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify code"
          )}
        </button>

        {/* Resend */}
        <p className="text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              {resending ? "Resending..." : "Resend code"}
            </button>
          ) : (
            <>
              Resend code in{" "}
              <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                {countdown}s
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg)" }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: "var(--color-primary)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}