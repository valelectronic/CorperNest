"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type  = searchParams.get("type");
  const email = searchParams.get("email") ?? "";
  const name  = searchParams.get("name") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [inputsLocked, setInputsLocked] = useState(false);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const hasAttempted = useRef(false);

  // Countdown — only ticks when inputs are locked after a wrong attempt
  useEffect(() => {
    if (!inputsLocked) return;
    if (countdown <= 0) {
      setCanResend(true);
      setInputsLocked(false);
      setOtp(["", "", "", "", "", ""]);
      hasAttempted.current = false;
      setTimeout(() => inputs.current[0]?.focus(), 50);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, inputsLocked]);

  const handleVerify = useCallback(async (code: string) => {


    if (code.length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

  if (type === "signup") {
  const { error } = await authClient.signIn.emailOtp({ email, otp: code });

      if (error) {
        setError(error.message ?? "Invalid or expired code.");
        setLoading(false);
        setInputsLocked(true);
        setCountdown(30);
        setCanResend(false);
        return;
      }

      if (name) await authClient.updateUser({ name });
      router.push("/role");
      return;
    }
      
    if (type === "signin") {
      const { error } = await authClient.signIn.emailOtp({ email, otp: code });

      if (error) {
        setError(error.message ?? "Invalid or expired code.");
        setLoading(false);
        setInputsLocked(true);
        setCountdown(30);
        setCanResend(false);
        return;
      }

      router.push("/home");
      return;
    }
  }, [email, name, type, router]);

  // Auto-verify when all 6 digits filled
  useEffect(() => {
    const code = otp.join("");
    if (code.length === 6 && !loading && !hasAttempted.current && !inputsLocked) {
      hasAttempted.current = true;
      handleVerify(code);
    }
  }, [otp, loading, handleVerify, inputsLocked]);

  function handleChange(index: number, value: string) {
    if (inputsLocked || loading) return;
    if (!/^\d*$/.test(value)) return;
    hasAttempted.current = false;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (inputsLocked || loading) return;
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (inputsLocked || loading) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      hasAttempted.current = false;
      setOtp(pasted.split(""));
      inputs.current[5]?.focus();
    }
  }

  async function handleResend() {
    hasAttempted.current = false;
    setResending(true);
    setError("");
    setInputsLocked(false);
    setOtp(["", "", "", "", "", ""]);
    setTimeout(() => inputs.current[0]?.focus(), 50);

    const otpType = "sign-in";
    await authClient.emailOtp.sendVerificationOtp({ email, type: otpType });

    setCountdown(30);
    setCanResend(false);
    setResending(false);
  }

  const isDisabled = loading || inputsLocked;

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
          Enter your code
        </h1>

        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          We sent a 6-digit code to{" "}
          <span className="break-all" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            {email || "your email"}
          </span>
        </p>

        <div className="grid grid-cols-6 gap-2 mb-5">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={isDisabled}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="aspect-square w-full text-center text-lg font-bold rounded-xl focus:outline-none transition-all"
              style={{
                border: inputsLocked
                  ? "1.5px solid #E53935"
                  : digit
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
                backgroundColor: inputsLocked
                  ? "#FFF5F5"
                  : loading
                  ? "var(--color-light)"
                  : "var(--color-bg)",
                color: "var(--color-text)",
                fontFamily: "var(--font-mono)",
                cursor: isDisabled ? "not-allowed" : "text",
              }}
            />
          ))}
        </div>

        {inputsLocked && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-sm text-center"
            style={{ backgroundColor: "#FFF5F5", border: "1px solid #FFCDD2", color: "#C62828" }}
          >
            Wrong code. Try again in{" "}
            <span className="font-bold">{countdown}s</span>
          </div>
        )}

        {error && !inputsLocked && (
          <p className="text-sm mb-4" style={{ color: "#E53935" }}>{error}</p>
        )}

        <button
          onClick={() => {
            if (isDisabled) return;
            hasAttempted.current = false;
            handleVerify(otp.join(""));
          }}
          disabled={isDisabled || otp.join("").length < 6}
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
          ) : !inputsLocked ? (
            <>
              Resend code in{" "}
              <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{countdown}s</span>
            </>
          ) : null}
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
            style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}