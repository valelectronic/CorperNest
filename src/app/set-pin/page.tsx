"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ForgotPinPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmed = identifier.trim();

    try {
      const checkRes = await fetch("/api/auth/check-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          method === "phone" ? { phone: trimmed } : { email: trimmed.toLowerCase() }
        ),
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.exists) {
        setError("No account found with these details. Create one instead.");
        setLoading(false);
        return;
      }

      const accountEmail = checkData.email;
      const accountPhone = checkData.phoneNumber;

      // ── Phone first — using the dedicated reset-password request, not
      // a generic OTP send. Falls back to email automatically if it fails.
      if (method === "phone" && accountPhone) {
        try {
          const { error: smsError } = await authClient.phoneNumber.requestPasswordReset({
            phoneNumber: accountPhone,
          });

          if (!smsError) {
            router.push(
              `/reset-pin?channel=sms&phone=${encodeURIComponent(accountPhone)}&email=${encodeURIComponent(accountEmail ?? "")}`
            );
            return;
          }
        } catch {
          // falls through to email fallback below
        }
      }

      if (!accountEmail) {
        setError("Could not send a reset code. Please contact support.");
        setLoading(false);
        return;
      }

      // ── Email path — must use type "forget-password" specifically, not
      // "sign-in". resetPassword() only validates against an OTP that was
      // sent for this exact purpose.
      const { error: emailError } = await authClient.emailOtp.sendVerificationOtp({
        email: accountEmail,
        type: "forget-password",
      });

      if (emailError) {
        setError(emailError.message ?? "Could not send a reset code. Try again.");
        setLoading(false);
        return;
      }

      router.push(`/reset-pin?channel=email&email=${encodeURIComponent(accountEmail)}`);
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
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
        <div className="mb-8">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            CorperNest
          </span>
        </div>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
        >
          Reset your PIN
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          We'll send a code to verify it's you
        </p>

        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
        >
          {(["phone", "email"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMethod(m); setIdentifier(""); setError(""); }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors"
              style={{
                backgroundColor: method === m ? "var(--color-action)" : "transparent",
                color: method === m ? "#FFFFFF" : "var(--color-text-secondary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {method === "phone" ? "Phone number" : "Email address"}
            </label>
            <input
              type={method === "phone" ? "tel" : "email"}
              inputMode={method === "phone" ? "numeric" : "email"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={method === "phone" ? "08012345678" : "you@example.com"}
              required
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#E53935" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-action)",
              color: "#FFFFFF",
              fontFamily: "var(--font-heading)",
            }}
          >
            {loading ? "Sending code..." : "Send code"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--color-text-muted)" }}>
          Remembered your PIN?{" "}
          <a href="/signin" className="font-medium" style={{ color: "var(--color-primary)" }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}